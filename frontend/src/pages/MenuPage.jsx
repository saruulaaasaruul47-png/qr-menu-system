import { useState } from 'react'
import { Plus, Tag, Filter, Edit2, Trash2, Search, Upload } from 'lucide-react'
import { Button } from '../components/atoms/Button'
import { Badge } from '../components/atoms/Badge'
import { Card } from '../components/atoms/Card'
import { Field } from '../components/atoms/Field'
import { SelectField } from '../components/atoms/SelectField'
import { TextArea } from '../components/atoms/TextArea'
import { Toggle } from '../components/atoms/Toggle'
import { Modal } from '../components/atoms/Modal'
import { FoodCard } from '../components/molecules/FoodCard'
import { PageHead } from '../components/molecules/PageHead'
import { Empty } from '../components/molecules/Empty'
import { ErrorState, LoadingState } from '../components/molecules/PageState'
import { api } from '../lib/api'
import { useAsync } from '../hooks/useAsync'

export function MenuPage({ restaurantId, refresh, nonce }) {
  const categories = useAsync(() => restaurantId ? api(`/categories/public?restaurantId=${restaurantId}`) : Promise.resolve([]), [restaurantId, nonce])
  const [filters, setFilters] = useState({ search: '', categoryId: '', minPrice: '', maxPrice: '', availableOnly: false, vegetarian: false, vegan: false, halal: false, spicy: false, glutenFree: false, nutFree: false, lang: '' })
  const foodQuery = new URLSearchParams(Object.entries({ restaurantId, ...filters }).filter(([, v]) => v !== '' && v !== false && v !== undefined)).toString()
  const foods = useAsync(() => restaurantId ? api(`/foods/public?${foodQuery}`) : Promise.resolve([]), [restaurantId, nonce, foodQuery])
  const coupons = useAsync(() => restaurantId ? api(`/coupons?restaurantId=${restaurantId}`) : Promise.resolve([]), [restaurantId, nonce])
  const [category, setCategory] = useState('')
  const [couponForm, setCouponForm] = useState({ code: '', type: 'PERCENT', discountValue: '', minOrderAmount: '', maxDiscountAmount: '', usageLimit: '', expiresAt: '', isActive: true })
  const [food, setFood] = useState({ name: '', nameMn: '', nameEn: '', nameCn: '', price: '', discountPrice: '', categoryId: '', description: '', descriptionMn: '', descriptionEn: '', descriptionCn: '', imageUrl: '', ingredients: '', allergens: '', preparationTime: '', isAvailable: true, trackInventory: false, stockQuantity: '', isVegetarian: false, isVegan: false, isHalal: false, isSpicy: false, isGlutenFree: false, isNutFree: false })
  const [selectedFood, setSelectedFood] = useState(null)
  const [modifier, setModifier] = useState({ name: '', isRequired: false, minSelect: 0, maxSelect: 1, optionName: '', priceDelta: 0 })
  const groups = useAsync(() => selectedFood?.id ? api(`/foods/${selectedFood.id}/modifier-groups`) : Promise.resolve([]), [selectedFood?.id, nonce])
  const [showAdd, setShowAdd] = useState(false)
  const [tab, setTab] = useState('foods')
  const [message, setMessage] = useState('')

  const foodPayload = () => ({
    restaurantId,
    categoryId: food.categoryId || undefined,
    name: food.name,
    nameI18n: { mn: food.nameMn || undefined, en: food.nameEn || undefined, cn: food.nameCn || undefined },
    description: food.description || undefined,
    descriptionI18n: { mn: food.descriptionMn || undefined, en: food.descriptionEn || undefined, cn: food.descriptionCn || undefined },
    price: Number(food.price),
    discountPrice: food.discountPrice === '' ? undefined : Number(food.discountPrice),
    imageUrl: food.imageUrl || undefined,
    ingredients: food.ingredients ? food.ingredients.split(',').map((s) => s.trim()).filter(Boolean) : undefined,
    allergens: food.allergens ? food.allergens.split(',').map((s) => s.trim()).filter(Boolean) : undefined,
    preparationTime: food.preparationTime ? Number(food.preparationTime) : undefined,
    isAvailable: food.isAvailable, trackInventory: food.trackInventory,
    stockQuantity: food.stockQuantity === '' ? undefined : Number(food.stockQuantity),
    isVegetarian: food.isVegetarian, isVegan: food.isVegan, isHalal: food.isHalal,
    isSpicy: food.isSpicy, isGlutenFree: food.isGlutenFree, isNutFree: food.isNutFree,
  })

  const saveCategory = async (e) => {
    e.preventDefault()
    setMessage('')
    await api('/categories', { method: 'POST', body: JSON.stringify({ restaurantId, name: category }) })
    setCategory('')
    refresh()
  }
  const saveCoupon = async (e) => {
    e.preventDefault()
    setMessage('')
    await api('/coupons', {
      method: 'POST',
      body: JSON.stringify({
        restaurantId,
        code: couponForm.code,
        type: couponForm.type,
        discountValue: Number(couponForm.discountValue),
        minOrderAmount: couponForm.minOrderAmount === '' ? undefined : Number(couponForm.minOrderAmount),
        maxDiscountAmount: couponForm.maxDiscountAmount === '' ? undefined : Number(couponForm.maxDiscountAmount),
        usageLimit: couponForm.usageLimit === '' ? undefined : Number(couponForm.usageLimit),
        expiresAt: couponForm.expiresAt ? new Date(couponForm.expiresAt).toISOString() : undefined,
        isActive: couponForm.isActive,
      }),
    })
    setCouponForm({ code: '', type: 'PERCENT', discountValue: '', minOrderAmount: '', maxDiscountAmount: '', usageLimit: '', expiresAt: '', isActive: true })
    refresh()
  }
  const toggleCoupon = async (item) => {
    await api(`/coupons/${item.id}`, { method: 'PATCH', body: JSON.stringify({ isActive: !item.isActive }) })
    refresh()
  }
  const deleteCoupon = async (item) => {
    if (!window.confirm(`Delete coupon ${item.code}?`)) return
    await api(`/coupons/${item.id}`, { method: 'DELETE' })
    refresh()
  }
  const renameCategory = async (item) => {
    const name = window.prompt('Category name', item.name)
    if (!name) return
    await api(`/categories/${item.id}`, { method: 'PATCH', body: JSON.stringify({ name }) })
    refresh()
  }
  const deleteCategory = async (item) => {
    if (!window.confirm(`Delete category ${item.name}?`)) return
    await api(`/categories/${item.id}`, { method: 'DELETE' })
    refresh()
  }
  const saveFood = async (e) => {
    e.preventDefault()
    setMessage('')
    await api('/foods', { method: 'POST', body: JSON.stringify(foodPayload()) })
    setFood({ name: '', nameMn: '', nameEn: '', nameCn: '', price: '', discountPrice: '', categoryId: '', description: '', descriptionMn: '', descriptionEn: '', descriptionCn: '', imageUrl: '', ingredients: '', allergens: '', preparationTime: '', isAvailable: true, trackInventory: false, stockQuantity: '', isVegetarian: false, isVegan: false, isHalal: false, isSpicy: false, isGlutenFree: false, isNutFree: false })
    setShowAdd(false)
    refresh()
  }
  const toggleFood = async (item) => {
    setMessage('')
    await api(`/foods/${item.id}`, { method: 'PATCH', body: JSON.stringify({ isAvailable: !item.isAvailable }) })
    refresh()
  }
  const deleteFood = async (item) => {
    if (!window.confirm(`Delete food ${item.name}?`)) return
    setMessage('')
    await api(`/foods/${item.id}`, { method: 'DELETE' })
    refresh()
  }
  const uploadFoodImage = async (item, file) => {
    if (!file) return
    setMessage('')
    const body = new FormData()
    body.append('image', file)
    try {
      await api(`/foods/${item.id}/image`, { method: 'POST', body })
      setMessage('Image uploaded')
      refresh()
    } catch (err) {
      setMessage(err.message)
    }
  }
  const createModifier = async (e) => {
    e.preventDefault()
    if (!selectedFood?.id) return
    setMessage('')
    await api(`/foods/${selectedFood.id}/modifier-groups`, {
      method: 'POST',
      body: JSON.stringify({ name: modifier.name, isRequired: modifier.isRequired, minSelect: Number(modifier.minSelect), maxSelect: Number(modifier.maxSelect), options: modifier.optionName ? [{ name: modifier.optionName, priceDelta: Number(modifier.priceDelta), isAvailable: true }] : [] }),
    })
    setModifier({ name: '', isRequired: false, minSelect: 0, maxSelect: 1, optionName: '', priceDelta: 0 })
    refresh()
  }
  const addOption = async (group) => {
    const name = window.prompt('Option name')
    if (!name) return
    const priceDelta = Number(window.prompt('Price delta', '0') || 0)
    await api(`/modifier-groups/${group.id}/options`, { method: 'POST', body: JSON.stringify({ name, priceDelta, isAvailable: true }) })
    refresh()
  }
  const renameModifierGroup = async (group) => {
    const name = window.prompt('Modifier group name', group.name)
    if (!name) return
    await api(`/modifier-groups/${group.id}`, { method: 'PATCH', body: JSON.stringify({ name }) })
    refresh()
  }
  const deleteModifierGroup = async (group) => {
    if (!window.confirm(`Delete modifier group ${group.name}?`)) return
    await api(`/modifier-groups/${group.id}`, { method: 'DELETE' })
    refresh()
  }
  const updateOption = async (option) => {
    const name = window.prompt('Option name', option.name)
    if (!name) return
    const priceDelta = Number(window.prompt('Price delta', String(option.priceDelta || 0)) || 0)
    await api(`/modifier-options/${option.id}`, { method: 'PATCH', body: JSON.stringify({ name, priceDelta }) })
    refresh()
  }
  const toggleOption = async (option) => {
    await api(`/modifier-options/${option.id}`, { method: 'PATCH', body: JSON.stringify({ isAvailable: !option.isAvailable }) })
    refresh()
  }
  const deleteOption = async (option) => {
    if (!window.confirm(`Delete option ${option.name}?`)) return
    await api(`/modifier-options/${option.id}`, { method: 'DELETE' })
    refresh()
  }

  return (
    <>
      <PageHead
        title="Menu Management"
        subtitle={`${(foods.data || []).length} items across ${(categories.data || []).length} categories`}
        actions={
          <>
            <Button variant="outline" size="sm"><Filter size={11} /> Filters</Button>
            <Button size="sm" onClick={() => setShowAdd(true)}><Plus size={11} /> Add Food</Button>
          </>
        }
      />
      {message && <div className="mb-4 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700">{message}</div>}
      {((categories.loading && !categories.data) || (foods.loading && !foods.data)) && <LoadingState title="Loading menu..." />}
      {(categories.error || foods.error) && <ErrorState error={categories.error || foods.error} />}

      {/* Tabs */}
      <div className="mb-5 flex gap-1 rounded-xl border border-slate-200 bg-white p-1 w-fit">
        {[{ id: 'foods', label: 'Menu Items' }, { id: 'categories', label: 'Categories' }, { id: 'coupons', label: 'Coupons' }].map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`rounded-lg px-4 py-2 text-[12px] font-bold transition-all ${tab === id ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-100'}`}
          >{label}</button>
        ))}
      </div>

      {/* Categories tab */}
      {tab === 'categories' && (
        <Card className="mb-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="m-0 text-[13px] font-bold text-slate-900">Categories</h3>
            <span className="text-[12px] text-slate-400">{(categories.data || []).length} total</span>
          </div>
          <form onSubmit={saveCategory} className="mb-4 grid grid-cols-[minmax(0,1fr)_auto] items-end gap-3 max-sm:grid-cols-1">
            <Field label="Category name" icon={Tag} placeholder="e.g. Starters, Mains, Desserts…" value={category} onChange={(e) => setCategory(e.target.value)} />
            <Button><Plus size={11} /> Create</Button>
          </form>
          <div className="flex flex-wrap gap-2">
            {(categories.data || []).map((c) => (
              <span key={c.id} className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5">
                <span className="text-[12px] font-semibold text-slate-700">{c.name}</span>
                <button onClick={() => renameCategory(c)} className="text-blue-500 hover:text-blue-700"><Edit2 size={10} /></button>
                <button onClick={() => deleteCategory(c)} className="text-red-400 hover:text-red-600"><Trash2 size={10} /></button>
              </span>
            ))}
            {!(categories.data || []).length && <p className="text-[12px] text-slate-400">No categories yet</p>}
          </div>
        </Card>
      )}

      {tab === 'coupons' && (
        <Card className="mb-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="m-0 text-[13px] font-bold text-slate-900">Coupons</h3>
            <span className="text-[12px] text-slate-400">{(coupons.data || []).length} total</span>
          </div>
          <form onSubmit={saveCoupon} className="mb-5 grid grid-cols-6 items-end gap-3 max-xl:grid-cols-3 max-md:grid-cols-1">
            <Field label="Code" value={couponForm.code} onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })} placeholder="LUNCH10" />
            <SelectField label="Type" value={couponForm.type} onChange={(e) => setCouponForm({ ...couponForm, type: e.target.value })}>
              <option value="PERCENT">Percent</option>
              <option value="FIXED">Fixed</option>
            </SelectField>
            <Field label="Value" value={couponForm.discountValue} onChange={(e) => setCouponForm({ ...couponForm, discountValue: e.target.value })} />
            <Field label="Min order" value={couponForm.minOrderAmount} onChange={(e) => setCouponForm({ ...couponForm, minOrderAmount: e.target.value })} />
            <Field label="Usage limit" value={couponForm.usageLimit} onChange={(e) => setCouponForm({ ...couponForm, usageLimit: e.target.value })} />
            <Button><Plus size={11} /> Create</Button>
          </form>
          <div className="grid gap-2">
            {(coupons.data || []).map((item) => (
              <div key={item.id} className="flex flex-wrap items-center gap-3 rounded-lg border border-slate-100 bg-slate-50 p-3">
                <Badge tone={item.isActive ? 'success' : 'slate'}>{item.code}</Badge>
                <span className="text-[12px] font-semibold text-slate-700">{item.type === 'PERCENT' ? `${item.discountValue}%` : item.discountValue}</span>
                <span className="text-[11px] text-slate-400">Used {item.usedCount}{item.usageLimit ? ` / ${item.usageLimit}` : ''}</span>
                <div className="ml-auto flex gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => toggleCoupon(item)}>{item.isActive ? 'Disable' : 'Enable'}</Button>
                  <button onClick={() => deleteCoupon(item)} className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-300 hover:bg-red-50 hover:text-red-500">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
            {!(coupons.data || []).length && <Empty title="No coupons yet" />}
          </div>
        </Card>
      )}

      {/* Foods tab: filter row */}
      {tab === 'foods' && (
        <>
          <Card className="mb-5">
            <div className="grid grid-cols-6 gap-3 max-xl:grid-cols-3 max-md:grid-cols-1">
              <Field label="Search" icon={Search} placeholder="Food name…" value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} />
              <SelectField label="Category" value={filters.categoryId} onChange={(e) => setFilters({ ...filters, categoryId: e.target.value })}>
                <option value="">All categories</option>
                {(categories.data || []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </SelectField>
              <Field label="Min price" value={filters.minPrice} onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })} />
              <Field label="Max price" value={filters.maxPrice} onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })} />
              <SelectField label="Language" value={filters.lang} onChange={(e) => setFilters({ ...filters, lang: e.target.value })}>
                <option value="">Default</option><option value="mn">MN</option><option value="en">EN</option><option value="cn">CN</option>
              </SelectField>
              <Toggle label="Available only" checked={filters.availableOnly} onChange={(v) => setFilters({ ...filters, availableOnly: v })} />
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {['vegetarian', 'vegan', 'halal', 'spicy', 'glutenFree', 'nutFree'].map((key) => (
                <button
                  key={key}
                  onClick={() => setFilters({ ...filters, [key]: !filters[key] })}
                  className={`rounded-xl px-3 py-1.5 text-[11px] font-semibold transition-all ${filters[key] ? 'bg-slate-900 text-white' : 'border border-slate-200 bg-white text-slate-500 hover:bg-slate-50'}`}
                >
                  {key}
                </button>
              ))}
            </div>
          </Card>

          <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-4">
            {(foods.data || []).map((item) => (
              <div key={item.id} className="grid gap-2">
                <FoodCard food={item} />
                <div className="flex flex-wrap gap-1.5">
                  <Button variant="outline" size="sm" onClick={() => setSelectedFood(item)}>Modifiers</Button>
                  <label className="inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50">
                    <Upload size={11} /> Image
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => uploadFoodImage(item, e.target.files?.[0])} />
                  </label>
                  <Button variant="outline" size="sm" onClick={() => toggleFood(item)}>
                    {item.isAvailable ? 'Hide' : 'Show'}
                  </Button>
                  <button onClick={() => deleteFood(item)} className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-300 hover:bg-red-50 hover:text-red-500">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
          {!(foods.data || []).length && <Empty title="No foods found" />}
        </>
      )}

      {/* Add food modal */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add New Menu Item" width="max-w-2xl">
        <form onSubmit={saveFood} className="grid gap-4">
          <div className="grid grid-cols-2 gap-3 max-sm:grid-cols-1">
            <Field label="Food name *" value={food.name} onChange={(e) => setFood({ ...food, name: e.target.value })} placeholder="e.g. Grilled Salmon" />
            <Field label="Price *" value={food.price} onChange={(e) => setFood({ ...food, price: e.target.value })} placeholder="0.00" />
          </div>
          <div className="grid grid-cols-3 gap-3 max-md:grid-cols-1">
            <Field label="Mongolian name" value={food.nameMn} onChange={(e) => setFood({ ...food, nameMn: e.target.value })} />
            <Field label="English name" value={food.nameEn} onChange={(e) => setFood({ ...food, nameEn: e.target.value })} />
            <Field label="Chinese name" value={food.nameCn} onChange={(e) => setFood({ ...food, nameCn: e.target.value })} />
          </div>
          <div className="grid grid-cols-3 gap-3 max-md:grid-cols-1">
            <SelectField label="Category" value={food.categoryId} onChange={(e) => setFood({ ...food, categoryId: e.target.value })}>
              <option value="">No category</option>
              {(categories.data || []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </SelectField>
            <Field label="Discount price" value={food.discountPrice} onChange={(e) => setFood({ ...food, discountPrice: e.target.value })} />
            <Field label="Prep time (min)" value={food.preparationTime} onChange={(e) => setFood({ ...food, preparationTime: e.target.value })} />
          </div>
          <Field label="Image URL" value={food.imageUrl} onChange={(e) => setFood({ ...food, imageUrl: e.target.value })} placeholder="https://..." />
          <TextArea label="Description" value={food.description} onChange={(e) => setFood({ ...food, description: e.target.value })} />
          <div className="grid grid-cols-2 gap-3 max-sm:grid-cols-1">
            <Field label="Ingredients (comma-separated)" value={food.ingredients} onChange={(e) => setFood({ ...food, ingredients: e.target.value })} />
            <Field label="Allergens (comma-separated)" value={food.allergens} onChange={(e) => setFood({ ...food, allergens: e.target.value })} />
          </div>
          <div className="flex flex-wrap gap-3">
            {['isAvailable', 'trackInventory', 'isVegetarian', 'isVegan', 'isHalal', 'isSpicy', 'isGlutenFree', 'isNutFree'].map((key) => (
              <Toggle key={key} label={key} checked={food[key]} onChange={(v) => setFood({ ...food, [key]: v })} />
            ))}
          </div>
          {food.trackInventory && <Field label="Stock quantity" value={food.stockQuantity} onChange={(e) => setFood({ ...food, stockQuantity: e.target.value })} />}
          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" type="button" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button variant="dark" className="flex-1">Add Food</Button>
          </div>
        </form>
      </Modal>

      {/* Modifier groups modal */}
      <Modal open={!!selectedFood} onClose={() => setSelectedFood(null)} title={`Modifiers — ${selectedFood?.name || ''}`} width="max-w-2xl">
        {selectedFood && (
          <>
            <form onSubmit={createModifier} className="mb-5 grid grid-cols-6 items-end gap-3 max-xl:grid-cols-3 max-md:grid-cols-1">
              <Field label="Group name" value={modifier.name} onChange={(e) => setModifier({ ...modifier, name: e.target.value })} placeholder="e.g. Size" />
              <Field label="Min" value={modifier.minSelect} onChange={(e) => setModifier({ ...modifier, minSelect: e.target.value })} />
              <Field label="Max" value={modifier.maxSelect} onChange={(e) => setModifier({ ...modifier, maxSelect: e.target.value })} />
              <Field label="First option" value={modifier.optionName} onChange={(e) => setModifier({ ...modifier, optionName: e.target.value })} />
              <Field label="Price delta" value={modifier.priceDelta} onChange={(e) => setModifier({ ...modifier, priceDelta: e.target.value })} />
              <Button>Create</Button>
            </form>
            <div className="grid gap-3">
              {(groups.data || []).map((group) => (
                <div key={group.id} className="rounded-xl border border-slate-100 p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <b className="text-[13px] text-slate-900">{group.name}</b>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => renameModifierGroup(group)}><Edit2 size={10} /> Rename</Button>
                      <Button variant="outline" size="sm" onClick={() => addOption(group)}><Plus size={10} /> Add option</Button>
                      <button onClick={() => deleteModifierGroup(group)} className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-300 hover:bg-red-50 hover:text-red-500"><Trash2 size={12} /></button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {group.options?.map((opt) => (
                      <span key={opt.id} className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-2 py-1">
                        <Badge tone={opt.isAvailable === false ? 'danger' : 'slate'}>{opt.name} {opt.priceDelta ? `+${opt.priceDelta}` : ''}</Badge>
                        <button onClick={() => updateOption(opt)} className="text-blue-500"><Edit2 size={10} /></button>
                        <button onClick={() => toggleOption(opt)} className="text-slate-400">{opt.isAvailable === false ? 'Show' : 'Hide'}</button>
                        <button onClick={() => deleteOption(opt)} className="text-red-400"><Trash2 size={10} /></button>
                      </span>
                    ))}
                  </div>
                </div>
              ))}
              {!(groups.data || []).length && <p className="text-[12px] text-slate-400">No modifier groups yet</p>}
            </div>
          </>
        )}
      </Modal>
    </>
  )
}
