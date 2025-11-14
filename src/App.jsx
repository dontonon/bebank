import { useState, useEffect } from 'react'
import Dashboard from './components/Dashboard'
import SourcesList from './components/SourcesList'
import AddEditSource from './components/AddEditSource'

function App() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [sources, setSources] = useState([])
  const [editingSource, setEditingSource] = useState(null)
  const [showAddEdit, setShowAddEdit] = useState(false)

  // Load sources from localStorage on mount
  useEffect(() => {
    const savedSources = localStorage.getItem('incomeSources')
    if (savedSources) {
      setSources(JSON.parse(savedSources))
    }
  }, [])

  // Save sources to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('incomeSources', JSON.stringify(sources))
  }, [sources])

  const addSource = (source) => {
    setSources([...sources, { ...source, id: Date.now(), active: true }])
    setShowAddEdit(false)
  }

  const updateSource = (updatedSource) => {
    setSources(sources.map(s => s.id === updatedSource.id ? updatedSource : s))
    setShowAddEdit(false)
    setEditingSource(null)
  }

  const deleteSource = (id) => {
    setSources(sources.filter(s => s.id !== id))
  }

  const toggleActive = (id) => {
    setSources(sources.map(s =>
      s.id === id ? { ...s, active: !s.active } : s
    ))
  }

  const handleEdit = (source) => {
    setEditingSource(source)
    setShowAddEdit(true)
  }

  const handleAddNew = () => {
    setEditingSource(null)
    setShowAddEdit(true)
  }

  return (
    <div className="min-h-screen bg-dark-bg">
      {/* Header */}
      <header className="bg-dark-card border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-4xl font-bold gradient-text">
            💰 Crypto Income Portfolio
          </h1>
          <p className="text-gray-400 mt-2">Track and analyze your income streams</p>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="flex space-x-4 border-b border-gray-800">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-6 py-3 font-semibold transition-all duration-200 ${
              activeTab === 'dashboard'
                ? 'text-toxic-green border-b-2 border-toxic-green'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            📊 Dashboard
          </button>
          <button
            onClick={() => setActiveTab('sources')}
            className={`px-6 py-3 font-semibold transition-all duration-200 ${
              activeTab === 'sources'
                ? 'text-toxic-green border-b-2 border-toxic-green'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            📝 Income Sources
          </button>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'dashboard' ? (
          <Dashboard sources={sources.filter(s => s.active)} />
        ) : (
          <SourcesList
            sources={sources}
            onEdit={handleEdit}
            onDelete={deleteSource}
            onToggleActive={toggleActive}
            onAddNew={handleAddNew}
          />
        )}
      </main>

      {/* Add/Edit Modal */}
      {showAddEdit && (
        <AddEditSource
          source={editingSource}
          onSave={editingSource ? updateSource : addSource}
          onClose={() => {
            setShowAddEdit(false)
            setEditingSource(null)
          }}
        />
      )}
    </div>
  )
}

export default App
