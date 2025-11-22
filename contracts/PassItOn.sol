// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IERC20 {
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
    function transfer(address recipient, uint256 amount) external returns (bool);
}

/**
 * @title PassItOn
 * @notice Blind gifting chain - give to receive, receive to give
 * @dev Each gift can only be claimed once by depositing a new gift
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
    }

    // Gift ID => Gift details
    mapping(uint256 => Gift) public gifts;

    // Current gift ID counter
    uint256 public nextGiftId;

    // Treasury address (receives 1%)
    address public treasury;

    // Minimum gift value in wei (prevents spam)
    uint256 public constant MIN_GIFT_VALUE = 0.000334 ether; // ~$1.00 at $3000 ETH

    // Protocol fee (1% = 100 basis points)
    uint256 public constant PROTOCOL_FEE_BPS = 100; // 1%
    uint256 public constant BPS_DENOMINATOR = 10000;

    event GiftCreated(
        uint256 indexed giftId,
        address indexed giver,
        address token,
        uint256 amount,
        uint256 timestamp
    );

    event GiftClaimed(
        uint256 indexed oldGiftId,
        uint256 indexed newGiftId,
        address indexed claimer,
        address receivedToken,
        uint256 receivedAmount,
        address givenToken,
        uint256 givenAmount
    );

    event TreasuryUpdated(address indexed oldTreasury, address indexed newTreasury);

    error InsufficientValue();
    error GiftAlreadyClaimed();
    error GiftDoesNotExist();
    error TransferFailed();
    error InvalidTreasury();

    constructor(address _treasury) {
        if (_treasury == address(0)) revert InvalidTreasury();
        treasury = _treasury;
    }

    /**
     * @notice Create a new gift (step 1 of chain)
     * @param token ERC20 token address or address(0) for ETH
     * @param amount Amount to gift (must be >= MIN_GIFT_VALUE)
     */
    function createGift(address token, uint256 amount) external payable returns (uint256 giftId) {
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

        giftId = nextGiftId++;

        gifts[giftId] = Gift({
            token: token,
            amount: amount,
            giver: msg.sender,
            claimed: false,
            claimer: address(0),
            timestamp: block.timestamp,
            claimedAt: 0
        });

        emit GiftCreated(giftId, msg.sender, token, amount, block.timestamp);
    }

    /**
     * @notice Claim an existing gift by creating a new one
     * @param giftIdToClaim The gift you want to claim
     * @param newGiftToken Token for your new gift
     * @param newGiftAmount Amount for your new gift
     */
    function claimGift(
        uint256 giftIdToClaim,
        address newGiftToken,
        uint256 newGiftAmount
    ) external payable returns (uint256 newGiftId) {
        Gift storage gift = gifts[giftIdToClaim];

        // Validations
        if (gift.giver == address(0)) revert GiftDoesNotExist();
        if (gift.claimed) revert GiftAlreadyClaimed();

        // Mark as claimed
        gift.claimed = true;
        gift.claimer = msg.sender;
        gift.claimedAt = block.timestamp;

        // Calculate amounts (99% to claimer, 1% to treasury)
        uint256 protocolFee = (gift.amount * PROTOCOL_FEE_BPS) / BPS_DENOMINATOR;
        uint256 claimerAmount = gift.amount - protocolFee;

        // Transfer claimed gift to claimer (99%)
        if (gift.token == address(0)) {
            // ETH
            (bool success1, ) = msg.sender.call{value: claimerAmount}("");
            if (!success1) revert TransferFailed();

            (bool success2, ) = treasury.call{value: protocolFee}("");
            if (!success2) revert TransferFailed();
        } else {
            // ERC20
            bool success1 = IERC20(gift.token).transfer(msg.sender, claimerAmount);
            if (!success1) revert TransferFailed();

            bool success2 = IERC20(gift.token).transfer(treasury, protocolFee);
            if (!success2) revert TransferFailed();
        }

        // Create new gift from claimer
        if (newGiftToken == address(0)) {
            // Native ETH
            if (msg.value < MIN_GIFT_VALUE) revert InsufficientValue();
            newGiftAmount = msg.value;
        } else {
            // ERC20
            if (newGiftAmount < MIN_GIFT_VALUE) revert InsufficientValue();

            bool success = IERC20(newGiftToken).transferFrom(msg.sender, address(this), newGiftAmount);
            if (!success) revert TransferFailed();
        }

        newGiftId = nextGiftId++;

        gifts[newGiftId] = Gift({
            token: newGiftToken,
            amount: newGiftAmount,
            giver: msg.sender,
            claimed: false,
            claimer: address(0),
            timestamp: block.timestamp,
            claimedAt: 0
        });

        emit GiftClaimed(
            giftIdToClaim,
            newGiftId,
            msg.sender,
            gift.token,
            claimerAmount,
            newGiftToken,
            newGiftAmount
        );
    }

    /**
     * @notice Get gift details
     */
    function getGift(uint256 giftId) external view returns (Gift memory) {
        return gifts[giftId];
    }

    /**
     * @notice Check if gift exists and is claimable
     */
    function isGiftClaimable(uint256 giftId) external view returns (bool) {
        Gift storage gift = gifts[giftId];
        return gift.giver != address(0) && !gift.claimed;
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
