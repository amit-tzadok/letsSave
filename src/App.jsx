import { useEffect, useMemo, useState } from 'react'
import './App.css'

const STORAGE_KEY = 'letsSave.v1'

const defaultData = {
  available: 500,
  creditCardBalance: 0,
  hangoutTemplates: [
    {
      id: 'nyc-day',
      name: 'NYC day trip',
      train: 60,
      meals: 45,
      activity: 35,
    },
  ],
  wishlist: [],
  goals: [
    {
      id: 'japan-trip',
      name: 'Japan trip',
      target: 2000,
      saved: 500,
    },
    {
      id: 'iphone',
      name: 'New iPhone',
      target: 1200,
      saved: 0,
    },
  ],
}

const getId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return `goal-${Date.now()}-${Math.round(Math.random() * 1e9)}`
}

const clampNumber = (value) => {
  if (!Number.isFinite(value)) return 0
  return Math.max(0, value)
}

const formatMoney = (value) => {
  return value.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  })
}

function App() {
  console.log('🎨 App loaded with NEW enhanced code!')
  
  const [data, setData] = useState(() => {
    if (typeof window === 'undefined') return defaultData
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (!stored) return defaultData
      const parsed = JSON.parse(stored)
      if (!parsed || typeof parsed !== 'object') return defaultData
      return {
        available: clampNumber(parsed.available),
        creditCardBalance: clampNumber(parsed.creditCardBalance),
        hangoutTemplates: Array.isArray(parsed.hangoutTemplates)
          ? parsed.hangoutTemplates.map((template) => ({
              id: template.id || getId(),
              name: template.name || 'Hangout',
              train: clampNumber(template.train),
              meals: clampNumber(template.meals),
              activity: clampNumber(template.activity),
            }))
          : defaultData.hangoutTemplates,
        wishlist: Array.isArray(parsed.wishlist)
          ? parsed.wishlist.map((item) => ({
              id: item.id || getId(),
              title: item.title || 'Wish',
              price: clampNumber(item.price),
              link: item.link || '',
            }))
          : [],
        goals: Array.isArray(parsed.goals)
          ? parsed.goals.map((goal) => ({
              id: goal.id || getId(),
              name: goal.name || 'Untitled goal',
              target: clampNumber(goal.target),
              saved: clampNumber(goal.saved),
            }))
          : defaultData.goals,
      }
    } catch (error) {
      return defaultData
    }
  })

  const [adjustAmount, setAdjustAmount] = useState('')
  const [adjustType, setAdjustType] = useState('add')
  const [cardAmount, setCardAmount] = useState('')
  const [cardType, setCardType] = useState('charge')
  const [newGoalName, setNewGoalName] = useState('')
  const [newGoalTarget, setNewGoalTarget] = useState('')
  const [transferAmounts, setTransferAmounts] = useState({})
  const [editingGoals, setEditingGoals] = useState({})
  const [editDrafts, setEditDrafts] = useState({})
  const [deleteCandidate, setDeleteCandidate] = useState(null)
  const [hangoutBudget, setHangoutBudget] = useState({
    train: '',
    meals: '',
    activity: '',
  })
  const [hangoutTemplateName, setHangoutTemplateName] = useState('')
  const [actionTab, setActionTab] = useState('cash')
  const [coinAmount, setCoinAmount] = useState('')
  const [isPiggyDrop, setIsPiggyDrop] = useState(false)
  const [piggyCelebrate, setPiggyCelebrate] = useState(false)
  const [wishTitle, setWishTitle] = useState('')
  const [wishPrice, setWishPrice] = useState('')
  const [wishLink, setWishLink] = useState('')
  const [notification, setNotification] = useState(null)
  const [activeTooltip, setActiveTooltip] = useState(null)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  }, [data])

  const showNotification = (message, type = 'success') => {
    console.log('Showing notification:', message, type)
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 3000)
  }

  const totals = useMemo(() => {
    const saved = data.goals.reduce((sum, goal) => sum + goal.saved, 0)
    const target = data.goals.reduce((sum, goal) => sum + goal.target, 0)
    return { saved, target }
  }, [data.goals])

  const leftToSave = Math.max(totals.target - totals.saved, 0)
  const netAvailable = data.available - data.creditCardBalance
  const hangoutTotal =
    clampNumber(Number(hangoutBudget.train)) +
    clampNumber(Number(hangoutBudget.meals)) +
    clampNumber(Number(hangoutBudget.activity))

  const handleAdjustBalance = (event) => {
    event.preventDefault()
    const amount = clampNumber(Number(adjustAmount))
    if (!amount) return

    setData((prev) => {
      const delta = adjustType === 'add' ? amount : -amount
      return {
        ...prev,
        available: clampNumber(prev.available + delta),
      }
    })
    setAdjustAmount('')
    showNotification(
      adjustType === 'add'
        ? `Added ${formatMoney(amount)} to your balance`
        : `Removed ${formatMoney(amount)} from your balance`
    )
  }

  const handleAddGoal = (event) => {
    event.preventDefault()
    const target = clampNumber(Number(newGoalTarget))
    const name = newGoalName.trim()
    if (!name || !target) return

    setData((prev) => ({
      ...prev,
      goals: [
        ...prev.goals,
        {
          id: getId(),
          name,
          target,
          saved: 0,
        },
      ],
    }))
    setNewGoalName('')
    setNewGoalTarget('')
    showNotification(`Created new goal: ${name}`)
  }

  const handleCreditCard = (event) => {
    event.preventDefault()
    const amount = clampNumber(Number(cardAmount))
    if (!amount) return

    setData((prev) => {
      if (cardType === 'charge') {
        showNotification(`Added ${formatMoney(amount)} to card balance`)
        return {
          ...prev,
          creditCardBalance: prev.creditCardBalance + amount,
        }
      }

      const payment = Math.min(amount, prev.available, prev.creditCardBalance)
      showNotification(`Paid ${formatMoney(payment)} to credit card`)
      return {
        ...prev,
        available: prev.available - payment,
        creditCardBalance: prev.creditCardBalance - payment,
      }
    })
    setCardAmount('')
  }

  const resetCreditCard = () => {
    if (data.creditCardBalance === 0) return
    showNotification(`Credit card balance reset from ${formatMoney(data.creditCardBalance)}`)
    setData((prev) => ({
      ...prev,
      creditCardBalance: 0,
    }))
  }

  const handleHangoutBudget = (field, value) => {
    setHangoutBudget((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const createGoalFromHangout = () => {
    if (!hangoutTotal) return
    setData((prev) => ({
      ...prev,
      goals: [
        ...prev.goals,
        {
          id: getId(),
          name: 'NYC day trip',
          target: hangoutTotal,
          saved: 0,
        },
      ],
    }))
  }

  const addWishlistItem = (event) => {
    event.preventDefault()
    const title = wishTitle.trim()
    const price = clampNumber(Number(wishPrice))
    const link = wishLink.trim()
    if (!title || !price) return

    setData((prev) => ({
      ...prev,
      wishlist: [
        ...(Array.isArray(prev.wishlist) ? prev.wishlist : []),
        {
          id: getId(),
          title,
          price,
          link,
        },
      ],
    }))
    setWishTitle('')
    setWishPrice('')
    setWishLink('')
  }

  const createGoalFromWish = (item) => {
    if (!item || !item.price) return
    setData((prev) => ({
      ...prev,
      goals: [
        ...prev.goals,
        {
          id: getId(),
          name: item.title,
          target: item.price,
          saved: 0,
        },
      ],
    }))
  }

  const deleteWishlistItem = (itemId) => {
    setData((prev) => ({
      ...prev,
      wishlist: (prev.wishlist || []).filter((item) => item.id !== itemId),
    }))
  }

  const handleCoinDragStart = (event) => {
    const amount = clampNumber(Number(coinAmount))
    if (!amount) {
      event.preventDefault()
      return
    }
    event.dataTransfer.setData('text/plain', String(amount))
    event.dataTransfer.effectAllowed = 'copy'
  }

  const handleQuickDeposit = () => {
    const amount = clampNumber(Number(coinAmount))
    if (!amount) return
    setData((prev) => ({
      ...prev,
      available: prev.available + amount,
    }))
    setCoinAmount('')
    setPiggyCelebrate(true)
    showNotification(`Added ${formatMoney(amount)} to available cash`)
    window.setTimeout(() => setPiggyCelebrate(false), 900)
  }

  const handlePiggyDrop = (event) => {
    event.preventDefault()
    const amount = clampNumber(Number(event.dataTransfer.getData('text/plain')))
    if (!amount) return
    setData((prev) => ({
      ...prev,
      available: prev.available + amount,
    }))
    setIsPiggyDrop(false)
    setPiggyCelebrate(true)
    window.setTimeout(() => setPiggyCelebrate(false), 900)
  }

  const handlePiggyDragOver = (event) => {
    event.preventDefault()
    setIsPiggyDrop(true)
  }

  const handlePiggyDragLeave = () => {
    setIsPiggyDrop(false)
  }

  const saveHangoutTemplate = () => {
    const name = hangoutTemplateName.trim()
    if (!name || !hangoutTotal) return

    setData((prev) => ({
      ...prev,
      hangoutTemplates: [
        ...prev.hangoutTemplates,
        {
          id: getId(),
          name,
          train: clampNumber(Number(hangoutBudget.train)),
          meals: clampNumber(Number(hangoutBudget.meals)),
          activity: clampNumber(Number(hangoutBudget.activity)),
        },
      ],
    }))
    setHangoutTemplateName('')
  }

  const applyHangoutTemplate = (template) => {
    setHangoutBudget({
      train: String(template.train ?? ''),
      meals: String(template.meals ?? ''),
      activity: String(template.activity ?? ''),
    })
  }

  const updateTransferAmount = (goalId, value) => {
    setTransferAmounts((prev) => ({
      ...prev,
      [goalId]: value,
    }))
  }

  const startEditGoal = (goal) => {
    setEditingGoals((prev) => ({ ...prev, [goal.id]: true }))
    setEditDrafts((prev) => ({
      ...prev,
      [goal.id]: {
        name: goal.name,
        target: goal.target,
        saved: goal.saved,
      },
    }))
  }

  const updateEditDraft = (goalId, field, value) => {
    setEditDrafts((prev) => ({
      ...prev,
      [goalId]: {
        ...prev[goalId],
        [field]: value,
      },
    }))
  }

  const cancelEditGoal = (goalId) => {
    setEditingGoals((prev) => ({ ...prev, [goalId]: false }))
  }

  const saveGoalEdits = (goalId) => {
    const draft = editDrafts[goalId]
    if (!draft) return
    const name = draft.name.trim()
    const target = clampNumber(Number(draft.target))
    const saved = clampNumber(Number(draft.saved))
    if (!name || !target) return

    setData((prev) => ({
      ...prev,
      goals: prev.goals.map((goal) =>
        goal.id === goalId ? { ...goal, name, target, saved } : goal
      ),
    }))
    setEditingGoals((prev) => ({ ...prev, [goalId]: false }))
  }

  const deleteGoal = (goalId) => {
    const goal = data.goals.find((item) => item.id === goalId)
    if (!goal) return
    setDeleteCandidate(goal)
  }

  const confirmDeleteGoal = () => {
    if (!deleteCandidate) return
    const goalId = deleteCandidate.id
    setData((prev) => ({
      ...prev,
      goals: prev.goals.filter((goal) => goal.id !== goalId),
    }))
    setDeleteCandidate(null)
  }

  const cancelDeleteGoal = () => {
    setDeleteCandidate(null)
  }

  const moveToGoal = (goalId) => {
    const amount = clampNumber(Number(transferAmounts[goalId]))
    if (!amount) return

    setData((prev) => {
      const available = prev.available
      if (!available) return prev
      const moveAmount = Math.min(amount, available)

      return {
        ...prev,
        available: available - moveAmount,
        goals: prev.goals.map((goal) =>
          goal.id === goalId
            ? { ...goal, saved: goal.saved + moveAmount }
            : goal
        ),
      }
    })
    updateTransferAmount(goalId, '')
    showNotification(`Saved ${formatMoney(amount)} to your goal!`)
  }

  const releaseFromGoal = (goalId) => {
    const amount = clampNumber(Number(transferAmounts[goalId]))
    if (!amount) return

    setData((prev) => {
      const goal = prev.goals.find((item) => item.id === goalId)
      if (!goal || !goal.saved) return prev
      const moveAmount = Math.min(amount, goal.saved)

      return {
        ...prev,
        available: prev.available + moveAmount,
        goals: prev.goals.map((item) =>
          item.id === goalId ? { ...item, saved: item.saved - moveAmount } : item
        ),
      }
    })
    updateTransferAmount(goalId, '')
    showNotification(`Released ${formatMoney(amount)} from goal`)
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="top-brand">
          <span className="logo-dot" />
          LetsSave
        </div>
        <nav className="side-nav">
          <a href="#overview">Overview</a>
          <a href="#balance">Balance</a>
          <a href="#wishlist">Wishlist</a>
          <a href="#goals">Goals</a>
        </nav>
        <div className="side-footer">
          <p>Stay focused on the goals you love.</p>
        </div>
      </aside>

      <main className="app">
        <div className="main-grid">
          <div className="content">
            <header className="hero" id="overview">
              <div
                className={
                  piggyCelebrate
                    ? 'piggy-card celebrate'
                    : isPiggyDrop
                      ? 'piggy-card drop'
                      : 'piggy-card'
                }
                onDrop={handlePiggyDrop}
                onDragOver={handlePiggyDragOver}
                onDragLeave={handlePiggyDragLeave}
              >
                  <svg className="piggy-graphic" viewBox="0 0 120 80" role="img">
                    <rect x="10" y="20" width="100" height="50" rx="8" fill="rgba(255,255,255,0.2)" />
                    <rect x="20" y="30" width="80" height="8" rx="4" fill="rgba(255,255,255,0.3)" />
                    <circle cx="60" cy="55" r="12" fill="rgba(255,255,255,0.25)" />
                    <rect x="56" y="48" width="8" height="14" rx="2" fill="rgba(255,255,255,0.4)" />
                  </svg>
                  <p className="piggy-caption">Quick Deposit</p>
                  <div className="piggy-actions">
                    <label className="input-group">
                      <span>Amount</span>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={coinAmount}
                        onChange={(event) => setCoinAmount(event.target.value)}
                        placeholder="100"
                      />
                    </label>
                    <button
                      className="coin"
                      type="button"
                      onClick={handleQuickDeposit}
                    >
                      <span>{coinAmount ? `Add $${coinAmount}` : 'Add'}</span>
                    </button>
                  </div>
              </div>
              <div className="totals-card">
                <div>
                  <p className="label">Available cash</p>
                  <p className="value">{formatMoney(netAvailable)}</p>
                </div>
                <div>
                  <p className="label">Total saved</p>
                  <p className="value">{formatMoney(totals.saved)}</p>
                </div>
                <div className="totals-meta">
                  <span>Targets: {formatMoney(totals.target)}</span>
                  <span>{data.goals.length} goals</span>
                </div>
              </div>
            </header>

            <section className="kpi-strip">
              <div className="kpi-card">
                <p className="label">Available</p>
                <p className="value">{formatMoney(netAvailable)}</p>
                <span className="kpi-chip">After credit card</span>
              </div>
              <div className="kpi-card">
                <p className="label">Total saved</p>
                <p className="value">{formatMoney(totals.saved)}</p>
                <span className="kpi-chip">Keep the streak</span>
              </div>
              <div className="kpi-card">
                <p className="label">Credit card</p>
                <p className="value">{formatMoney(data.creditCardBalance)}</p>
                <div className="kpi-actions">
                  <span className="kpi-chip">Balance owed</span>
                  {data.creditCardBalance > 0 && (
                    <button className="kpi-reset" onClick={resetCreditCard}>Reset</button>
                  )}
                </div>
              </div>
              <div className="kpi-card">
                <p className="label">Left to goal</p>
                <p className="value">{formatMoney(leftToSave)}</p>
                <span className="kpi-chip">Targets: {formatMoney(totals.target)}</span>
              </div>
              <div className="kpi-card">
                <p className="label">Active goals</p>
                <p className="value">{data.goals.length}</p>
                <span className="kpi-chip">Stay consistent</span>
              </div>
              <div className="kpi-card">
                <p className="label">Net available</p>
                <p className="value">{formatMoney(netAvailable)}</p>
                <span className="kpi-chip">Cash - card</span>
              </div>
            </section>

            <section className="actions" id="balance">
              <div className="section-heading">
                <h2>Actions</h2>
                <p>Update cash, track card spending, and build short‑term budgets.</p>
              </div>
              <div className="action-tabs">
                <button
                  type="button"
                  className={actionTab === 'cash' ? 'tab active' : 'tab'}
                  onClick={() => setActionTab('cash')}
                >
                  Cash
                </button>
                <button
                  type="button"
                  className={actionTab === 'card' ? 'tab active' : 'tab'}
                  onClick={() => setActionTab('card')}
                >
                  Card
                </button>
                <button
                  type="button"
                  className={actionTab === 'hangout' ? 'tab active' : 'tab'}
                  onClick={() => setActionTab('hangout')}
                >
                  Hangout
                </button>
                <button
                  type="button"
                  className={actionTab === 'goal' ? 'tab active' : 'tab'}
                  onClick={() => setActionTab('goal')}
                >
                  New Goal
                </button>
              </div>
              <div className="panel-grid">
                {actionTab === 'cash' ? (
                  <form className="panel" onSubmit={handleAdjustBalance}>
                  <div className="panel-header">
                    <h3>Update cash</h3>
                    <p>Add income or log a spend to keep your balance honest.</p>
                  </div>
                  <div className="panel-body">
                    <label className="input-group">
                      <span>Amount</span>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={adjustAmount}
                        onChange={(event) => setAdjustAmount(event.target.value)}
                        placeholder="200"
                      />
                    </label>
                    <div className="toggle-row">
                      <label className={adjustType === 'add' ? 'toggle active' : 'toggle'}>
                        <input
                          type="radio"
                          name="adjust"
                          value="add"
                          checked={adjustType === 'add'}
                          onChange={() => setAdjustType('add')}
                        />
                        Add money
                      </label>
                      <label className={adjustType === 'spend' ? 'toggle active' : 'toggle'}>
                        <input
                          type="radio"
                          name="adjust"
                          value="spend"
                          checked={adjustType === 'spend'}
                          onChange={() => setAdjustType('spend')}
                        />
                        Spent money
                      </label>
                    </div>
                    <button className="primary" type="submit">
                      Update balance
                    </button>
                  </div>
                  </form>
                ) : null}

                {actionTab === 'card' ? (
                  <form className="panel" id="credit-card" onSubmit={handleCreditCard}>
                  <div className="panel-header">
                    <h3>Credit card</h3>
                    <p>Log charges or payments to keep your net cash honest.</p>
                  </div>
                  <div className="panel-body">
                    <label className="input-group">
                      <span>Amount</span>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={cardAmount}
                        onChange={(event) => setCardAmount(event.target.value)}
                        placeholder="120"
                      />
                    </label>
                    <div className="toggle-row">
                      <label className={cardType === 'charge' ? 'toggle active' : 'toggle'}>
                        <input
                          type="radio"
                          name="card"
                          value="charge"
                          checked={cardType === 'charge'}
                          onChange={() => setCardType('charge')}
                        />
                        Charge
                      </label>
                      <label className={cardType === 'pay' ? 'toggle active' : 'toggle'}>
                        <input
                          type="radio"
                          name="card"
                          value="pay"
                          checked={cardType === 'pay'}
                          onChange={() => setCardType('pay')}
                        />
                        Pay card
                      </label>
                    </div>
                    <button className="primary" type="submit">
                      Update card
                    </button>
                  </div>
                  </form>
                ) : null}

                {actionTab === 'hangout' ? (
                  <div className="panel" id="hangout">
                  <div className="panel-header">
                    <h3>Hangout budget</h3>
                    <p>Plan a NYC day trip with train, meals, and activity costs.</p>
                  </div>
                  <div className="panel-body">
                    <div className="template-row">
                      <span className="label">Templates</span>
                      <div className="template-chips">
                        {data.hangoutTemplates.map((template) => (
                          <button
                            key={template.id}
                            className="pill ghost"
                            type="button"
                            onClick={() => applyHangoutTemplate(template)}
                          >
                            {template.name}
                          </button>
                        ))}
                      </div>
                    </div>
                    <label className="input-group">
                      <span>Train</span>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={hangoutBudget.train}
                        onChange={(event) => handleHangoutBudget('train', event.target.value)}
                        placeholder="60"
                      />
                    </label>
                    <label className="input-group">
                      <span>Meals</span>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={hangoutBudget.meals}
                        onChange={(event) => handleHangoutBudget('meals', event.target.value)}
                        placeholder="45"
                      />
                    </label>
                    <label className="input-group">
                      <span>Activity</span>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={hangoutBudget.activity}
                        onChange={(event) => handleHangoutBudget('activity', event.target.value)}
                        placeholder="35"
                      />
                    </label>
                    <div className="hangout-total">
                      <span>Total</span>
                      <strong>{formatMoney(hangoutTotal)}</strong>
                    </div>
                    <div className="hangout-actions">
                      <button className="primary" type="button" onClick={createGoalFromHangout}>
                        Create piggybank
                      </button>
                      <div className="template-save">
                        <input
                          type="text"
                          value={hangoutTemplateName}
                          onChange={(event) => setHangoutTemplateName(event.target.value)}
                          placeholder="Save as template..."
                        />
                        <button className="pill" type="button" onClick={saveHangoutTemplate}>
                          Save template
                        </button>
                      </div>
                    </div>
                  </div>
                  </div>
                ) : null}

                {actionTab === 'goal' ? (
                  <form className="panel" id="new-goal" onSubmit={handleAddGoal}>
                  <div className="panel-header">
                    <h3>New saving goal</h3>
                    <p>Name what you want and set the target amount.</p>
                  </div>
                  <div className="panel-body">
                    <label className="input-group">
                      <span>Goal name</span>
                      <input
                        type="text"
                        value={newGoalName}
                        onChange={(event) => setNewGoalName(event.target.value)}
                        placeholder="Tokyo adventure"
                      />
                    </label>
                    <label className="input-group">
                      <span>Target</span>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={newGoalTarget}
                        onChange={(event) => setNewGoalTarget(event.target.value)}
                        placeholder="2500"
                      />
                    </label>
                    <button className="primary" type="submit">
                      Create goal
                    </button>
                  </div>
                  </form>
                ) : null}
              </div>
            </section>

            <section className="wishlist" id="wishlist">
              <div className="section-heading">
                <h2>Wishlist</h2>
                <p>Track items or experiences you want and their prices.</p>
              </div>
              <div className="panel-grid">
                <form className="panel" onSubmit={addWishlistItem}>
                  <div className="panel-header">
                    <h3>Add wish</h3>
                    <p>Save a name, price, and optional link.</p>
                  </div>
                  <div className="panel-body">
                    <label className="input-group">
                      <span>Item or experience</span>
                      <input
                        type="text"
                        value={wishTitle}
                        onChange={(event) => setWishTitle(event.target.value)}
                        placeholder="Weekend in NYC"
                      />
                    </label>
                    <label className="input-group">
                      <span>Price</span>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={wishPrice}
                        onChange={(event) => setWishPrice(event.target.value)}
                        placeholder="300"
                      />
                    </label>
                    <label className="input-group">
                      <span>Link (optional)</span>
                      <input
                        type="url"
                        value={wishLink}
                        onChange={(event) => setWishLink(event.target.value)}
                        placeholder="https://..."
                      />
                    </label>
                    <button className="primary" type="submit">
                      Add to wishlist
                    </button>
                  </div>
                </form>

                <div className="panel wishlist-list">
                  <div className="panel-header">
                    <h3>Saved wishes</h3>
                    <p>Keep your inspiration list close.</p>
                  </div>
                  <div className="panel-body">
                    {(data.wishlist || []).length ? (
                      <ul className="wish-items">
                        {data.wishlist.map((item) => (
                          <li key={item.id} className="wish-item">
                            <div className="wish-info">
                              <p className="wish-title">{item.title}</p>
                              <div className="wish-meta">
                                <span className="wish-price">{formatMoney(item.price)}</span>
                                {item.link ? (
                                  <a href={item.link} target="_blank" rel="noreferrer">
                                    Open link
                                  </a>
                                ) : (
                                  <span className="wish-link-missing">No link</span>
                                )}
                              </div>
                            </div>
                            <div className="wish-actions">
                              <button
                                className="pill ghost"
                                type="button"
                                onClick={() => createGoalFromWish(item)}
                              >
                                Make goal
                              </button>
                              <button
                                className="pill danger"
                                type="button"
                                onClick={() => deleteWishlistItem(item.id)}
                              >
                                Delete
                              </button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="empty-state">
                        <p>No wishes yet.</p>
                        <span>Add one to keep your motivation visible.</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </section>

            <section className="goals" id="goals">
              <div className="section-heading">
                <h2>Your piggybanks</h2>
                <p>Select a goal to see details and move money.</p>
              </div>

              <div className="goal-grid">
                {data.goals.map((goal) => {
                  const progressPct = goal.target
                    ? Math.min(100, Math.round((goal.saved / goal.target) * 100))
                    : 0
                  const remaining = Math.max(goal.target - goal.saved, 0)
                  const isEditing = Boolean(editingGoals[goal.id])

                  return (
                    <article className="goal-card" key={goal.id}>
                      <div className="goal-header">
                        <div>
                          {isEditing ? (
                            <div className="edit-fields">
                              <label className="input-group">
                                <span>Name</span>
                                <input
                                  type="text"
                                  value={editDrafts[goal.id]?.name ?? goal.name}
                                  onChange={(event) =>
                                    updateEditDraft(goal.id, 'name', event.target.value)
                                  }
                                />
                              </label>
                              <label className="input-group">
                                <span>Target</span>
                                <input
                                  type="number"
                                  min="0"
                                  step="1"
                                  value={editDrafts[goal.id]?.target ?? goal.target}
                                  onChange={(event) =>
                                    updateEditDraft(goal.id, 'target', event.target.value)
                                  }
                                />
                              </label>
                              <label className="input-group">
                                <span>Saved so far</span>
                                <input
                                  type="number"
                                  min="0"
                                  step="1"
                                  value={editDrafts[goal.id]?.saved ?? goal.saved}
                                  onChange={(event) =>
                                    updateEditDraft(goal.id, 'saved', event.target.value)
                                  }
                                />
                              </label>
                              <div className="drawer-actions">
                                <button
                                  className="pill ghost"
                                  type="button"
                                  onClick={() => cancelEditGoal(goal.id)}
                                >
                                  Cancel
                                </button>
                                <button
                                  className="pill"
                                  type="button"
                                  onClick={() => saveGoalEdits(goal.id)}
                                >
                                  Save
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <h3>{goal.name}</h3>
                              <p>
                                <strong>{formatMoney(goal.saved)}</strong> saved of{' '}
                                {formatMoney(goal.target)}
                              </p>
                            </>
                          )}
                        </div>
                        <div className="goal-actions">
                          {isEditing ? null : (
                            <>
                              <span className="progress-pill">{progressPct}%</span>
                              <button
                                className="pill ghost"
                                type="button"
                                onClick={() => startEditGoal(goal)}
                              >
                                Edit
                              </button>
                              <button
                                className="pill danger"
                                type="button"
                                onClick={() => deleteGoal(goal.id)}
                              >
                                Delete
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="goal-piggy">
                        <div className="goal-piggy-visual">
                          <svg className="piggy-graphic" viewBox="0 0 300 200" role="img">
                            <defs>
                              <linearGradient id={`piggyBody-${goal.id}`} x1="0" x2="1" y1="0" y2="1">
                                <stop offset="0%" stopColor="#ff9fd3" />
                                <stop offset="100%" stopColor="#ff6fb3" />
                              </linearGradient>
                              <linearGradient id={`piggyShade-${goal.id}`} x1="0" x2="1" y1="0" y2="0">
                                <stop offset="0%" stopColor="#ffb6dd" />
                                <stop offset="100%" stopColor="#ff7bc3" />
                              </linearGradient>
                            </defs>
                            <g className="piggy-body">
                              {/* main body */}
                              <ellipse cx="160" cy="110" rx="92" ry="60" fill={`url(#piggyBody-${goal.id})`} />
                              {/* belly highlight */}
                              <ellipse cx="140" cy="128" rx="58" ry="34" fill="rgba(255,255,255,0.18)" />
                              {/* head base */}
                              <ellipse cx="78" cy="108" rx="38" ry="30" fill={`url(#piggyShade-${goal.id})`} />
                              {/* ear back */}
                              <ellipse cx="76" cy="82" rx="20" ry="14" fill="#ff9fd3" />
                              {/* ear front */}
                              <ellipse cx="100" cy="82" rx="18" ry="12" fill="#ff7bc3" />
                              {/* coin slot */}
                              <rect x="130" y="92" width="70" height="12" rx="6" fill="#ffd3e9" />
                              {/* front leg */}
                              <rect x="118" y="140" width="18" height="30" rx="8" fill="#ff7bc3" />
                              {/* middle leg */}
                              <rect x="155" y="144" width="18" height="28" rx="8" fill="#ff7bc3" />
                              {/* back leg */}
                              <rect x="194" y="144" width="18" height="28" rx="8" fill="#ff7bc3" />
                              {/* snout */}
                              <circle cx="73" cy="110" r="12" fill="#ff7bc3" />
                              {/* nostril left */}
                              <circle cx="67" cy="108" r="3" fill="#2a1d23" />
                              {/* nostril right */}
                              <circle cx="79" cy="108" r="3" fill="#2a1d23" />
                              {/* eye front */}
                              <circle cx="92" cy="108" r="5" fill="#2a1d23" className="piggy-eye" />
                              {/* eye shine front */}
                              <circle cx="92" cy="108" r="2" fill="#fff" />
                              {/* eye front */}
                              <circle cx="55" cy="108" r="5" fill="#2a1d23" className="piggy-eye" />
                              {/* eye shine front */}
                              <circle cx="55" cy="108" r="2" fill="#fff" />
                              {/* tail */}
                              <path
                                className="piggy-tail"
                                d="M250 120 C268 116, 274 98, 252 92"
                                stroke="#ff7bc3"
                                strokeWidth="8"
                                fill="none"
                                strokeLinecap="round"
                              />
                            </g>
                          </svg>
                        </div>
                        <div className="goal-piggy-meter">
                          <span className="goal-piggy-fill" style={{ width: `${progressPct}%` }} />
                        </div>
                        <span className="goal-piggy-percent">{progressPct}%</span>
                      </div>
                      <div className="goal-meta">
                        <span>{formatMoney(remaining)} left to hit the target</span>
                        <span>{goal.saved > goal.target ? 'Ahead of goal!' : 'On your way'}</span>
                      </div>
                      <div className="transfer">
                        <label className="input-group">
                          <span>Move amount</span>
                          <input
                            type="number"
                            min="0"
                            step="1"
                            value={transferAmounts[goal.id] ?? ''}
                            onChange={(event) => updateTransferAmount(goal.id, event.target.value)}
                            placeholder="100"
                          />
                        </label>
                        <div className="transfer-actions">
                          <button type="button" onClick={() => moveToGoal(goal.id)}>
                            Save it
                          </button>
                          <button
                            className="ghost"
                            type="button"
                            onClick={() => releaseFromGoal(goal.id)}
                          >
                            Release
                          </button>
                        </div>
                        <p className="hint">
                          Available: {formatMoney(data.available)} • Saved in this goal:{' '}
                          {formatMoney(goal.saved)}
                        </p>
                      </div>
                    </article>
                  )
                })}
              </div>
            </section>
          </div>
        </div>
      </main>

      {deleteCandidate ? (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal-card">
            <p className="modal-emoji">🩷</p>
            <h3>Delete this piggybank?</h3>
            <p className="modal-text">
              You’re about to delete “{deleteCandidate.name}”. This can’t be undone.
            </p>
            <div className="modal-actions">
              <button className="pill ghost" type="button" onClick={cancelDeleteGoal}>
                Keep it
              </button>
              <button className="pill danger" type="button" onClick={confirmDeleteGoal}>
                Delete
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {notification ? (
        <div className={`notification ${notification.type}`} role="alert">
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M10 0C4.48 0 0 4.48 0 10s4.48 10 10 10 10-4.48 10-10S15.52 0 10 0zm-2 15l-5-5 1.41-1.41L8 12.17l7.59-7.59L17 6l-9 9z"
              fill="currentColor"
            />
          </svg>
          <span>{notification.message}</span>
        </div>
      ) : null}
    </div>
  )
}

export default App
