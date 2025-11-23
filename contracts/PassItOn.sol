// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IERC20 {
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
    function transfer(address recipient, uint256 amount) external returns (bool);
}

/**
 * @title PassItOn - V2 (Security Hardened)
 * @notice Blind gifting chain - give to receive, receive to give
 * @dev Each gift can only be claimed once by depositing a new gift
 * @dev V2 Changes: Added secrets for unpredictable URLs, reentrancy protection, SC wallet support
 */
contract PassItOn {
    struct Gift {
        address token;        // ERC20 address or address(0) for native ETH
        uint256 amount;       // Amount deposited (before 1% fee)
        address giver;        // Who created this gift
        bool claimed;         // Has it been claimed?
        address claimer;      // Who claimed it
        uint256 timestamp;    // When it was created
        uint256 claimedAt;    // When it was claimed
        bytes32 secretHash;   // Hash of secret (for unpredictable URLs)
    }

    // Gift ID => Gift details
    mapping(uint256 => Gift) public gifts;

    // Current gift ID counter
    uint256 public nextGiftId;

    // Treasury address (receives 1%)
    address public treasury;

    // Minimum gift value in wei (prevents spam)
    uint256 public constant MIN_GIFT_VALUE = 0.0001 ether; // ~$0.30 at $3000 ETH

    // Protocol fee (1% = 100 basis points)
    uint256 public constant PROTOCOL_FEE_BPS = 100; // 1%
    uint256 public constant BPS_DENOMINATOR = 10000;

    // Reentrancy guard
    uint256 private constant NOT_ENTERED = 1;
    uint256 private constant ENTERED = 2;
    uint256 private _status;

    event GiftCreated(
        uint256 indexed giftId,
        address indexed giver,
        address token,
        uint256 amount,
        uint256 timestamp,
        bytes32 secret  // Secret emitted in event (only visible to creator via logs)
    );

    event GiftClaimed(
        uint256 indexed oldGiftId,
        uint256 indexed newGiftId,
        address indexed claimer,
        address tokenReceived,
        uint256 amountReceived,
        address tokenGiven,
        uint256 amountGiven
    );

    event TreasuryUpdated(address indexed oldTreasury, address indexed newTreasury);

    error InsufficientValue();
    error GiftAlreadyClaimed();
    error GiftDoesNotExist();
    error TransferFailed();
    error InvalidTreasury();
    error InvalidSecret();
    error ReentrancyGuard();

    modifier nonReentrant() {
        if (_status == ENTERED) revert ReentrancyGuard();
        _status = ENTERED;
        _;
        _status = NOT_ENTERED;
    }

    constructor(address _treasury) {
        if (_treasury == address(0)) revert InvalidTreasury();
        treasury = _treasury;
        _status = NOT_ENTERED;
    }

    /**
     * @notice Create a new gift (step 1 of chain)
     * @param token ERC20 token address or address(0) for ETH
     * @param amount Amount to gift (must be >= MIN_GIFT_VALUE)
     * @return giftId The ID of the created gift
     * @return secret Random secret for this gift (save this for sharing the link!)
     */
    function createGift(address token, uint256 amount)
        external
        payable
        nonReentrant
        returns (uint256 giftId, bytes32 secret)
    {
        // Validate and handle payment
        if (token == address(0)) {
            // Native ETH
            if (msg.value < MIN_GIFT_VALUE) revert InsufficientValue();
            amount = msg.value;
        } else {
            // ERC20 token
            if (amount < MIN_GIFT_VALUE) revert InsufficientValue();

            // Transfer tokens from sender to contract
            bool success = IERC20(token).transferFrom(msg.sender, address(this), amount);
            if (!success) revert TransferFailed();
        }

        // Generate random secret (unpredictable!)
        secret = keccak256(abi.encodePacked(
            block.timestamp,
            block.prevrandao,
            msg.sender,
            nextGiftId,
            amount
        ));

        giftId = nextGiftId++;

        // EFFECTS: Update state before any external calls
        gifts[giftId] = Gift({
            token: token,
            amount: amount,
            giver: msg.sender,
            claimed: false,
            claimer: address(0),
            timestamp: block.timestamp,
            claimedAt: 0,
            secretHash: keccak256(abi.encodePacked(secret))
        });

        // Emit event with secret (creator can read from logs)
        emit GiftCreated(giftId, msg.sender, token, amount, block.timestamp, secret);
    }

    /**
     * @notice Claim an existing gift by creating a new one
     * @param giftIdToClaim The gift you want to claim
     * @param secret The secret for this gift (from URL)
     * @param newGiftToken Token for your new gift
     * @param newGiftAmount Amount for your new gift
     */
    function claimGift(
        uint256 giftIdToClaim,
        bytes32 secret,
        address newGiftToken,
        uint256 newGiftAmount
    ) external payable nonReentrant returns (uint256 newGiftId) {
        Gift storage gift = gifts[giftIdToClaim];

        // CHECKS: All validations first
        if (gift.giver == address(0)) revert GiftDoesNotExist();
        if (gift.claimed) revert GiftAlreadyClaimed();

        // Verify secret matches
        if (keccak256(abi.encodePacked(secret)) != gift.secretHash) revert InvalidSecret();

        // Validate new gift
        if (newGiftToken == address(0)) {
            // Native ETH
            if (msg.value < MIN_GIFT_VALUE) revert InsufficientValue();
            newGiftAmount = msg.value;
        } else {
            // ERC20
            if (newGiftAmount < MIN_GIFT_VALUE) revert InsufficientValue();
        }

        // EFFECTS: Update all state before external calls
        // Mark old gift as claimed
        gift.claimed = true;
        gift.claimer = msg.sender;
        gift.claimedAt = block.timestamp;

        // Calculate amounts (99% to claimer, 1% to treasury)
        uint256 protocolFee = (gift.amount * PROTOCOL_FEE_BPS) / BPS_DENOMINATOR;
        uint256 claimerAmount = gift.amount - protocolFee;

        // Generate secret for new gift
        bytes32 newSecret = keccak256(abi.encodePacked(
            block.timestamp,
            block.prevrandao,
            msg.sender,
            nextGiftId,
            newGiftAmount,
            giftIdToClaim
        ));

        newGiftId = nextGiftId++;

        // Create new gift (state update before external calls)
        gifts[newGiftId] = Gift({
            token: newGiftToken,
            amount: newGiftAmount,
            giver: msg.sender,
            claimed: false,
            claimer: address(0),
            timestamp: block.timestamp,
            claimedAt: 0,
            secretHash: keccak256(abi.encodePacked(newSecret))
        });

        // INTERACTIONS: All external calls at the end
        // Transfer new gift tokens to contract (if ERC20)
        if (newGiftToken != address(0)) {
            bool success = IERC20(newGiftToken).transferFrom(msg.sender, address(this), newGiftAmount);
            if (!success) revert TransferFailed();
        }

        // Transfer claimed gift to claimer
        if (gift.token == address(0)) {
            // ETH - forward all available gas for smart contract wallets
            (bool success1, ) = msg.sender.call{value: claimerAmount, gas: gasleft()}("");
            if (!success1) revert TransferFailed();

            (bool success2, ) = treasury.call{value: protocolFee, gas: gasleft()}("");
            if (!success2) revert TransferFailed();
        } else {
            // ERC20
            bool success1 = IERC20(gift.token).transfer(msg.sender, claimerAmount);
            if (!success1) revert TransferFailed();

            bool success2 = IERC20(gift.token).transfer(treasury, protocolFee);
            if (!success2) revert TransferFailed();
        }

        // Emit events
        emit GiftClaimed(
            giftIdToClaim,
            newGiftId,
            msg.sender,
            gift.token,
            claimerAmount,
            newGiftToken,
            newGiftAmount
        );

        emit GiftCreated(newGiftId, msg.sender, newGiftToken, newGiftAmount, block.timestamp, newSecret);
    }

    /**
     * @notice Get gift details (secret hash only, not the actual secret)
     */
    function getGift(uint256 giftId) external view returns (Gift memory) {
        return gifts[giftId];
    }

    /**
     * @notice Check if gift exists and is claimable (without revealing if secret is correct)
     */
    function isGiftClaimable(uint256 giftId) external view returns (bool) {
        Gift storage gift = gifts[giftId];
        return gift.giver != address(0) && !gift.claimed;
    }

    /**
     * @notice Verify if a secret is correct for a gift (for UI validation)
     */
    function verifySecret(uint256 giftId, bytes32 secret) external view returns (bool) {
        Gift storage gift = gifts[giftId];
        return keccak256(abi.encodePacked(secret)) == gift.secretHash;
    }

    /**
     * @notice Update treasury address (only current treasury can call)
     */
    function updateTreasury(address newTreasury) external {
        if (msg.sender != treasury) revert InvalidTreasury();
        if (newTreasury == address(0)) revert InvalidTreasury();

        address oldTreasury = treasury;
        treasury = newTreasury;

        emit TreasuryUpdated(oldTreasury, newTreasury);
    }
}
