function SourcesList({ sources, onEdit, onDelete, onToggleActive, onAddNew }) {
  return (
    <div className="space-y-6">
      {/* Header with Add Button */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Income Sources</h2>
          <p className="text-gray-400 mt-1">Manage your income streams</p>
        </div>
        <button
          onClick={onAddNew}
          className="bg-gradient-to-r from-toxic-green to-neon-purple text-dark-bg px-6 py-3 rounded-lg font-bold hover:shadow-lg hover:shadow-toxic-green/50 transition-all duration-300 transform hover:scale-105"
        >
          + Add New Source
        </button>
      </div>

      {/* Sources List */}
      {sources.length === 0 ? (
        <div className="bg-dark-card rounded-2xl p-12 text-center border border-gray-800">
          <div className="text-6xl mb-4">📝</div>
          <h3 className="text-2xl font-bold text-gray-300 mb-2">No Income Sources Yet</h3>
          <p className="text-gray-500 mb-6">Start tracking your income by adding your first source</p>
          <button
            onClick={onAddNew}
            className="bg-toxic-green text-dark-bg px-8 py-3 rounded-lg font-bold hover:bg-toxic-green/90 transition-all duration-300"
          >
            Add First Source
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sources.map(source => (
            <div
              key={source.id}
              className={`bg-dark-card rounded-xl p-6 border transition-all duration-300 ${
                source.active
                  ? 'border-gray-800 hover:border-toxic-green'
                  : 'border-gray-800 opacity-50'
              }`}
            >
              {/* Status Badge */}
              <div className="flex justify-between items-start mb-4">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    source.active
                      ? 'bg-toxic-green/20 text-toxic-green'
                      : 'bg-gray-700 text-gray-400'
                  }`}
                >
                  {source.active ? '● Active' : '○ Inactive'}
                </span>
                <span className="text-2xl">
                  {source.category === 'Protocol Partnerships' && '🤝'}
                  {source.category === 'Content Creation' && '✍️'}
                  {source.category === 'Consulting/Advisory' && '💼'}
                  {source.category === 'Dune Analytics' && '📊'}
                  {source.category === 'Other' && '💡'}
                </span>
              </div>

              {/* Source Info */}
              <h3 className="text-xl font-bold text-white mb-2">{source.name}</h3>
              <div className="text-gray-400 text-sm mb-4">{source.category}</div>

              {/* Amount */}
              <div className="mb-4">
                <div className="text-3xl font-bold gradient-text">
                  ${parseFloat(source.monthlyAmount).toLocaleString()}
                </div>
                <div className="text-gray-500 text-sm mt-1">{source.frequency}</div>
              </div>

              {/* Start Date */}
              <div className="text-gray-500 text-sm mb-4">
                Started: {new Date(source.startDate).toLocaleDateString()}
              </div>

              {/* Actions */}
              <div className="flex space-x-2">
                <button
                  onClick={() => onEdit(source)}
                  className="flex-1 bg-neon-purple/20 text-neon-purple py-2 rounded-lg font-semibold hover:bg-neon-purple/30 transition-all duration-200"
                >
                  Edit
                </button>
                <button
                  onClick={() => onToggleActive(source.id)}
                  className="flex-1 bg-gray-700 text-gray-300 py-2 rounded-lg font-semibold hover:bg-gray-600 transition-all duration-200"
                >
                  {source.active ? 'Deactivate' : 'Activate'}
                </button>
                <button
                  onClick={() => {
                    if (window.confirm(`Delete "${source.name}"?`)) {
                      onDelete(source.id)
                    }
                  }}
                  className="bg-red-500/20 text-red-400 px-4 py-2 rounded-lg font-semibold hover:bg-red-500/30 transition-all duration-200"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default SourcesList
