import { useEffect, useState } from 'react'
import {
  Search, QrCode, Moon, Sun, X, Plus, Minus, Heart,
  ShoppingCart, ChefHat, Bell, Languages,
} from 'lucide-react'
import { Empty } from '../components/molecules/Empty'
import { ErrorState, LoadingState } from '../components/molecules/PageState'
import { Button } from '../components/atoms/Button'
import { Field } from '../components/atoms/Field'
import { SelectField } from '../components/atoms/SelectField'
import { TextArea } from '../components/atoms/TextArea'
import { Toggle } from '../components/atoms/Toggle'
import { api } from '../lib/api'
import { money } from '../lib/format'
import { route } from '../lib/router'
import { useAsync } from '../hooks/useAsync'

const translations = {
  '': {
    dashboard: 'Dashboard',
    table: 'Table',
    qrMenu: 'QR Menu',
    searchPlaceholder: 'Search the menu...',
    language: 'Language',
    all: 'All',
    advancedFilters: 'Advanced Filters',
    minPrice: 'Min price',
    maxPrice: 'Max price',
    freshKitchen: 'Fresh from the kitchen.',
    spicy: 'Spicy',
    veg: 'Veg',
    addToOrder: 'Add to Order',
    noFoods: 'No foods found',
    viewOrder: 'View Order',
    serviceRequest: 'Service request',
    yourOrder: 'Your Order',
    each: 'each',
    subtotal: 'Subtotal',
    total: 'Total',
    checkout: 'Checkout',
    proceedToCheckout: 'Proceed to Checkout',
    phoneForLoyalty: 'Phone for loyalty',
    specialInstructions: 'Special instructions',
    paymentMethod: 'Payment method',
    totalAmount: 'Total Amount',
    placeOrder: 'Place Order',
    send: 'Send',
    service: 'Service',
    note: 'Note',
    sendRequest: 'Send request',
    serviceRequestSent: 'Service request sent',
    orderSent: 'Order sent',
    callWaiter: 'Call waiter',
    water: 'Water',
    cutlery: 'Cutlery',
    bill: 'Bill',
    cleanTable: 'Clean table',
  },
  mn: {
    dashboard: 'Хянах самбар',
    table: 'Ширээ',
    qrMenu: 'QR меню',
    searchPlaceholder: 'Менюнээс хайх...',
    language: 'Хэл',
    all: 'Бүгд',
    advancedFilters: 'Нарийвчилсан шүүлтүүр',
    minPrice: 'Доод үнэ',
    maxPrice: 'Дээд үнэ',
    freshKitchen: 'Гал тогооноос шинэхэн.',
    spicy: 'Халуун',
    veg: 'Ногоон',
    addToOrder: 'Захиалгад нэмэх',
    noFoods: 'Хоол олдсонгүй',
    viewOrder: 'Захиалга харах',
    serviceRequest: 'Үйлчилгээ дуудах',
    yourOrder: 'Таны захиалга',
    each: 'тус бүр',
    subtotal: 'Дүн',
    total: 'Нийт',
    checkout: 'Төлбөр төлөх',
    proceedToCheckout: 'Төлбөр рүү үргэлжлүүлэх',
    phoneForLoyalty: 'Урамшууллын утас',
    specialInstructions: 'Нэмэлт тайлбар',
    paymentMethod: 'Төлбөрийн арга',
    totalAmount: 'Нийт дүн',
    placeOrder: 'Захиалга илгээх',
    send: 'Илгээх',
    service: 'Үйлчилгээ',
    note: 'Тайлбар',
    sendRequest: 'Хүсэлт илгээх',
    serviceRequestSent: 'Үйлчилгээний хүсэлт илгээгдлээ',
    orderSent: 'Захиалга илгээгдлээ',
    callWaiter: 'Зөөгч дуудах',
    water: 'Ус',
    cutlery: 'Хэрэгсэл',
    bill: 'Тооцоо',
    cleanTable: 'Ширээ цэвэрлэх',
  },
  en: {},
  cn: {
    dashboard: '控制台',
    table: '桌号',
    qrMenu: '二维码菜单',
    searchPlaceholder: '搜索菜单...',
    language: '语言',
    all: '全部',
    advancedFilters: '高级筛选',
    minPrice: '最低价',
    maxPrice: '最高价',
    freshKitchen: '厨房新鲜制作。',
    spicy: '辣',
    veg: '素食',
    addToOrder: '加入订单',
    noFoods: '没有找到菜品',
    viewOrder: '查看订单',
    serviceRequest: '服务请求',
    yourOrder: '您的订单',
    each: '每份',
    subtotal: '小计',
    total: '总计',
    checkout: '结账',
    proceedToCheckout: '继续结账',
    phoneForLoyalty: '会员电话',
    specialInstructions: '特殊要求',
    paymentMethod: '支付方式',
    totalAmount: '总金额',
    placeOrder: '提交订单',
    send: '发送',
    service: '服务',
    note: '备注',
    sendRequest: '发送请求',
    serviceRequestSent: '服务请求已发送',
    orderSent: '订单已发送',
    callWaiter: '呼叫服务员',
    water: '水',
    cutlery: '餐具',
    bill: '账单',
    cleanTable: '清理桌面',
  },
}

export function CustomerMenuPage({ path }) {
  const parts = path.split('/')
  const restaurantId = parts[2]
  const tableId = parts[4] || parts[3]
  const [cart, setCart] = useState([])
  const [filters, setFilters] = useState({ categoryId: '', search: '', minPrice: '', maxPrice: '', vegetarian: false, vegan: false, halal: false, spicy: false, glutenFree: false, nutFree: false, lang: '' })
  const [checkout, setCheckout] = useState({ note: '', customerPhone: '', provider: 'DEMO' })
  const [couponCode, setCouponCode] = useState('')
  const [coupon, setCoupon] = useState(null)
  const [selectedModifiers, setSelectedModifiers] = useState({})
  const [waiter, setWaiter] = useState({ requestType: 'CALL_WAITER', note: '' })
  const [message, setMessage] = useState('')
  const [cartOpen, setCartOpen] = useState(false)
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [serviceOpen, setServiceOpen] = useState(false)
  const [languageOpen, setLanguageOpen] = useState(false)
  const [dark, setDark] = useState(false)

  const foodQuery = new URLSearchParams(Object.entries({ restaurantId, availableOnly: true, ...filters }).filter(([, v]) => v !== '' && v !== false && v !== undefined)).toString()
  const restaurant = useAsync(() => restaurantId ? api(`/restaurants/public/${restaurantId}`) : Promise.resolve(null), [restaurantId])
  const categories = useAsync(() => restaurantId ? api(`/categories/public?restaurantId=${restaurantId}`) : Promise.resolve([]), [restaurantId])
  const foods = useAsync(() => restaurantId ? api(`/foods/public?${foodQuery}`) : Promise.resolve([]), [restaurantId, foodQuery])
  const visible = foods.data || []

  const optionPrice = (food, optionId) => (
    food.modifierGroups
      ?.flatMap((group) => group.options || [])
      .find((option) => option.id === optionId)
      ?.priceDelta || 0
  )
  const lineKey = (foodId, modifierOptionIds = []) => `${foodId}:${[...modifierOptionIds].sort().join(',')}`
  const linePrice = (item) => Number(item.discountPrice ?? item.price ?? 0)
    + (item.modifierOptionIds || []).reduce((sum, optionId) => sum + Number(optionPrice(item, optionId)), 0)

  const add = (food) => setCart((items) => {
    const modifierOptionIds = selectedModifiers[food.id] || []
    const key = lineKey(food.id, modifierOptionIds)
    const found = items.find((i) => i.key === key)
    return found
      ? items.map((i) => i.key === key ? { ...i, quantity: i.quantity + 1 } : i)
      : [...items, { ...food, key, quantity: 1, modifierOptionIds }]
  })
  const qty = (key, delta) => setCart((items) => items.map((i) => i.key === key ? { ...i, quantity: i.quantity + delta } : i).filter((i) => i.quantity > 0))
  const toggleModifier = (foodId, optionId, checked) => setSelectedModifiers((cur) => {
    const next = new Set(cur[foodId] || [])
    checked ? next.add(optionId) : next.delete(optionId)
    return { ...cur, [foodId]: Array.from(next) }
  })

  const placeOrder = async () => {
    const guestSessionId = localStorage.getItem('guestSessionId') || crypto.randomUUID()
    localStorage.setItem('guestSessionId', guestSessionId)
    const created = await api('/orders/guest', {
      method: 'POST',
      body: JSON.stringify({
        restaurantId, tableId, guestSessionId, source: 'QR',
        note: checkout.note || undefined,
        customerPhone: checkout.customerPhone || undefined,
        couponCode: coupon?.code || undefined,
        payment: checkout.provider ? { provider: checkout.provider } : undefined,
        items: cart.map((i) => ({ foodId: i.id, quantity: i.quantity, modifierOptionIds: i.modifierOptionIds?.length ? i.modifierOptionIds : undefined })),
      }),
    })
    setCart([])
    setCoupon(null)
    setCouponCode('')
    setMessage(`${t('orderSent')}: ${created.id}`)
    route(`/order/status/${guestSessionId}`)
  }

  const applyCoupon = async () => {
    if (!couponCode.trim() || subtotal <= 0) return
    const result = await api(`/coupons/public/validate?restaurantId=${restaurantId}&code=${encodeURIComponent(couponCode)}&subtotal=${subtotal}`)
    setCoupon(result)
    setCouponCode(result.code)
  }

  const callWaiter = async (requestType = waiter.requestType, note = waiter.note) => {
    const guestSessionId = localStorage.getItem('guestSessionId') || crypto.randomUUID()
    localStorage.setItem('guestSessionId', guestSessionId)
    await api('/waiter-calls', { method: 'POST', body: JSON.stringify({ restaurantId, tableId, guestSessionId, requestType, note: note || undefined }) })
    setMessage(t('serviceRequestSent'))
    setServiceOpen(false)
  }

  useEffect(() => {
    if (restaurantId) api('/analytics/events', { method: 'POST', body: JSON.stringify({ restaurantId, type: 'QR_MENU_VIEW', payload: { tableId } }) }).catch(() => {})
  }, [restaurantId, tableId])

  const subtotal = cart.reduce((sum, i) => sum + linePrice(i) * i.quantity, 0)
  const discountAmount = coupon?.discountAmount || 0
  const total = Math.max(0, subtotal - discountAmount)
  const totalItems = cart.reduce((sum, i) => sum + i.quantity, 0)
  const t = (key) => translations[filters.lang]?.[key] || translations[''][key] || key
  const localizedFoodName = (food) => food.nameI18n?.[filters.lang] || food.displayName || food.name
  const localizedFoodDescription = (food) => food.descriptionI18n?.[filters.lang] || food.displayDescription || food.description || t('freshKitchen')
  const serviceActions = [
    { type: 'CALL_WAITER', label: t('callWaiter') },
    { type: 'REQUEST_WATER', label: t('water') },
    { type: 'REQUEST_CUTLERY', label: t('cutlery') },
    { type: 'REQUEST_BILL', label: t('bill') },
    { type: 'CLEAN_TABLE', label: t('cleanTable') },
  ]
  const languages = [
    { value: '', label: 'Default' },
    { value: 'mn', label: 'MN' },
    { value: 'en', label: 'EN' },
    { value: 'cn', label: 'CN' },
  ]
  const activeLanguage = languages.find((lang) => lang.value === filters.lang) || languages[0]
  const coverImageUrl = restaurant.data?.bannerUrl || restaurant.data?.logoUrl

  const bg = dark ? 'bg-[#0F172A]' : 'bg-[#F8FAFC]'
  const tx = dark ? 'text-white' : 'text-slate-900'
  const sub = dark ? 'text-slate-400' : 'text-slate-500'
  const card = dark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'
  const barBg = dark ? 'bg-[#0F172A] border-slate-800' : 'bg-white border-slate-100'
  const inp = dark ? 'border-slate-700 bg-slate-800 text-white placeholder:text-slate-500 focus:border-amber-400' : 'border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:border-amber-400'

  return (
    <main className={`min-h-screen ${bg}`} style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="mx-auto max-w-[1280px] space-y-6 p-4 pb-32 sm:p-6 sm:pb-32">
      {/* Hero banner */}
      <section className="relative h-[280px] overflow-hidden rounded-3xl border border-white/20 text-white shadow-[0_18px_50px_rgba(15,23,42,0.14)]">
        {coverImageUrl
          ? <img className="absolute inset-0 h-full w-full object-cover" src={coverImageUrl} alt="" />
          : <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,#fbbf24_0,#f59e0b_24%,#0f172a_74%)]" />
        }
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/20 to-black/70" />
        <div className="absolute left-4 right-4 top-4 z-10 flex items-center justify-between">
          <button
            onClick={() => setDark(!dark)}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/30 bg-white/20 text-white backdrop-blur-sm transition-colors hover:bg-white/30"
          >
            {dark ? <Sun size={15} /> : <Moon size={15} />}
          </button>
          <button
            onClick={() => route('/app')}
            className="rounded-xl border border-white/30 bg-white/20 px-3 py-2 text-[12px] font-bold text-white backdrop-blur-sm transition-colors hover:bg-white/30"
          >
            {t('dashboard')}
          </button>
        </div>
        <div className="absolute bottom-5 left-5 right-5 z-10 flex items-end gap-3">
          <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-white/90 shadow-xl backdrop-blur-sm">
            <QrCode size={24} className="text-slate-900" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-white">{restaurant.data?.name || 'Restaurant'}</h1>
            <div className="mt-0.5 flex items-center gap-3 text-[12px] text-white/60">
              <span>{t('table')} {tableId?.slice(0, 6)}</span>
              <span>{t('qrMenu')}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Sticky search & category bar */}
      <section className={`rounded-3xl border p-4 shadow-[0_10px_30px_rgba(15,23,42,0.06)] ${barBg}`}>
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              className={`w-full rounded-2xl border py-3 pl-9 pr-4 text-[13px] outline-none transition-all ${inp}`}
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              placeholder={t('searchPlaceholder')}
            />
          </div>
      </section>

      <section className={`rounded-3xl border p-4 shadow-[0_10px_30px_rgba(15,23,42,0.06)] ${card}`}>
          <div className="relative mb-3 inline-block">
            <button
              type="button"
              onClick={() => setLanguageOpen((open) => !open)}
              className={`flex min-h-10 items-center gap-2 rounded-2xl border px-3 text-[12px] font-black shadow-sm transition-all ${dark ? 'border-slate-700 bg-slate-800 text-slate-100' : 'border-slate-200 bg-white text-slate-800 hover:bg-slate-50'}`}
            >
              <Languages size={14} />
              {t('language')}: {activeLanguage.label}
            </button>
            {languageOpen && (
              <div className={`absolute left-0 top-12 z-30 w-40 overflow-hidden rounded-2xl border shadow-xl ${dark ? 'border-slate-700 bg-slate-800' : 'border-slate-100 bg-white'}`}>
                {languages.map((lang) => (
                  <button
                    key={lang.value || 'default'}
                    type="button"
                    onClick={() => {
                      setFilters({ ...filters, lang: lang.value })
                      setLanguageOpen(false)
                    }}
                    className={`block w-full px-3 py-2.5 text-left text-[12px] font-bold transition-colors ${filters.lang === lang.value ? 'bg-amber-400 text-slate-900' : dark ? 'text-slate-200 hover:bg-slate-700' : 'text-slate-600 hover:bg-slate-50'}`}
                  >
                    {lang.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <nav className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
            <button
              className={`flex-shrink-0 rounded-full px-4 py-1.5 text-[12px] font-bold transition-all ${!filters.categoryId ? 'bg-amber-400 text-slate-900' : sub}`}
              onClick={() => setFilters({ ...filters, categoryId: '' })}
            >{t('all')}</button>
            {(categories.data || []).map((c) => (
              <button
                key={c.id}
                className={`flex-shrink-0 rounded-full px-4 py-1.5 text-[12px] font-bold transition-all ${filters.categoryId === c.id ? 'bg-amber-400 text-slate-900' : sub}`}
                onClick={() => setFilters({ ...filters, categoryId: c.id })}
              >{c.name}</button>
            ))}
          </nav>
      </section>

      <section>
        <details className={`rounded-3xl border p-4 text-sm shadow-[0_10px_30px_rgba(15,23,42,0.06)] ${card}`}>
          <summary className={`font-bold ${tx}`}>{t('advancedFilters')}</summary>
          <div className="mt-3 grid grid-cols-3 gap-2 max-md:grid-cols-1">
            <Field label={t('minPrice')} value={filters.minPrice} onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })} />
            <Field label={t('maxPrice')} value={filters.maxPrice} onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })} />
            {['vegetarian', 'vegan', 'spicy'].map((key) => (
              <Toggle key={key} label={key} checked={filters[key]} onChange={(v) => setFilters({ ...filters, [key]: v })} />
            ))}
          </div>
        </details>
      </section>

      {((restaurant.loading && !restaurant.data) || (categories.loading && !categories.data) || (foods.loading && !foods.data)) && (
        <LoadingState title="Loading menu..." />
      )}
      {(restaurant.error || categories.error || foods.error) && (
        <ErrorState error={restaurant.error || categories.error || foods.error} />
      )}

      {/* Food grid */}
      <section className={`rounded-3xl border p-4 shadow-[0_14px_40px_rgba(15,23,42,0.07)] sm:p-6 ${card}`}>
        {visible.length ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {visible.map((food) => (
            <article key={food.id} className={`overflow-hidden rounded-2xl border shadow-sm transition-all duration-200 hover:shadow-md ${card}`}>
              <div className="relative h-44 overflow-hidden bg-slate-100">
                {food.imageUrl
                  ? <img src={food.imageUrl} alt={localizedFoodName(food)} className="h-full w-full object-cover transition-transform duration-300 hover:scale-105" />
                  : <div className="grid h-full place-items-center text-slate-300"><ChefHat size={40} /></div>
                }
                <button className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 shadow-sm backdrop-blur-sm transition-transform hover:scale-110">
                  <Heart size={14} className="text-slate-400" />
                </button>
                <div className="absolute bottom-3 left-3 flex gap-1.5">
                  {food.isSpicy && <span className="rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold text-white">{t('spicy')}</span>}
                  {food.isVegetarian && <span className="rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-bold text-white">{t('veg')}</span>}
                </div>
              </div>
              <div className="p-4">
                <div className="mb-1.5 flex items-start justify-between gap-2">
                  <h3 className={`text-[14px] font-bold leading-tight ${tx}`}>{localizedFoodName(food)}</h3>
                  <span className={`ml-2 flex-shrink-0 text-[16px] font-black ${tx}`}>{money(food.discountPrice || food.price)}</span>
                </div>
                <p className={`mb-3 line-clamp-2 text-[12px] leading-relaxed ${sub}`}>{localizedFoodDescription(food)}</p>
                {food.modifierGroups?.length ? (
                  <div className={`mb-3 rounded-xl p-2 text-[11px] ${dark ? 'bg-slate-700 text-slate-300' : 'bg-slate-50 text-slate-600'}`}>
                    {food.modifierGroups.map((group) => (
                      <div key={group.id}>
                        <b>{group.name}</b>
                        {group.options?.map((opt) => (
                          <label key={opt.id} className="mt-1 flex items-center gap-2">
                            <input type="checkbox" onChange={(e) => toggleModifier(food.id, opt.id, e.target.checked)} />
                            {opt.name} +{opt.priceDelta || 0}
                          </label>
                        ))}
                      </div>
                    ))}
                  </div>
                ) : null}
                <button
                  onClick={() => add(food)}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-2.5 text-[13px] font-bold text-white shadow-sm transition-all hover:bg-slate-800 active:scale-[0.98]"
                >
                  <Plus size={12} /> {t('addToOrder')}
                </button>
              </div>
            </article>
          ))}
        </div>
        ) : (
          <div className="grid min-h-[320px] place-items-center">
            <Empty title={t('noFoods')} />
          </div>
        )}
      </section>
      </div>

      {/* Floating cart button */}
      {totalItems > 0 && (
        <div className="fixed bottom-5 left-0 right-0 z-30 flex justify-center px-4">
          <button
            onClick={() => setCartOpen(true)}
            className="flex w-full max-w-sm items-center gap-4 rounded-2xl bg-[#0F172A] px-6 py-3.5 text-white shadow-2xl transition-all hover:bg-slate-800 active:scale-[0.98]"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-400 text-[12px] font-black text-slate-900">{totalItems}</span>
            <span className="flex-1 text-left font-bold">{t('viewOrder')}</span>
            <span className="font-black text-amber-400">{money(total)}</span>
          </button>
        </div>
      )}

      <button
        onClick={() => setServiceOpen(true)}
        className={`fixed ${totalItems > 0 ? 'bottom-24' : 'bottom-5'} right-4 z-30 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-400 text-slate-900 shadow-2xl transition-all hover:bg-amber-300 active:scale-95 sm:right-[max(1rem,calc((100vw-1280px)/2+24px))]`}
        aria-label={t('serviceRequest')}
      >
        <Bell size={21} />
      </button>

      {message && !checkoutOpen && !serviceOpen && (
        <div className="fixed bottom-24 left-4 right-20 z-30 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-[12px] font-bold text-emerald-700 shadow-lg sm:left-[max(1rem,calc((100vw-1280px)/2+24px))] sm:right-[max(5.5rem,calc((100vw-1280px)/2+96px))]">
          {message}
        </div>
      )}

      {/* Cart drawer */}
      {cartOpen && (
        <div className="fixed inset-0 z-40 flex justify-end">
          <button className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" onClick={() => setCartOpen(false)} />
          <aside className="z-10 flex h-full w-full max-w-sm flex-col bg-white shadow-2xl">
            <header className="flex items-center justify-between border-b border-slate-100 p-4">
              <h2 className="text-[15px] font-black text-slate-900">{t('yourOrder')}</h2>
              <button onClick={() => setCartOpen(false)} className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200">
                <X size={14} />
              </button>
            </header>
            <div className="flex-1 space-y-3 overflow-auto p-4">
              {cart.map((item) => (
                <div key={item.key} className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3">
                  <div className="grid h-12 w-12 place-items-center rounded-xl bg-slate-200 text-slate-400 overflow-hidden">
                    {item.imageUrl
                      ? <img src={item.imageUrl} alt={localizedFoodName(item)} className="h-full w-full object-cover" />
                      : <ChefHat size={20} />
                    }
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13px] font-bold text-slate-900">{localizedFoodName(item)}</div>
                    <div className="text-[11px] text-slate-400">{money(linePrice(item))} {t('each')}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => qty(item.key, -1)} className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white hover:bg-red-50 hover:text-red-500">
                      <Minus size={10} />
                    </button>
                    <span className="w-5 text-center text-[14px] font-black">{item.quantity}</span>
                    <button onClick={() => qty(item.key, 1)} className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-900 text-white hover:bg-slate-800">
                      <Plus size={10} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <footer className="border-t border-slate-100 p-4">
              <div className="mb-4 space-y-2 text-[13px]">
                <div className="flex justify-between text-slate-500"><span>{t('subtotal')}</span><span>{money(subtotal)}</span></div>
                {discountAmount > 0 && <div className="flex justify-between text-emerald-600"><span>Discount</span><span>-{money(discountAmount)}</span></div>}
                <div className="flex justify-between border-t border-slate-100 pt-2 text-[15px] font-black text-slate-900">
                  <span>{t('total')}</span><span>{money(total)}</span>
                </div>
              </div>
              <button
                onClick={() => { setCartOpen(false); setCheckoutOpen(true) }}
                className="w-full rounded-xl bg-slate-900 py-3.5 text-[14px] font-bold text-white hover:bg-slate-800"
              >
                {t('proceedToCheckout')}
              </button>
            </footer>
          </aside>
        </div>
      )}

      {/* Checkout modal */}
      {checkoutOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center p-4">
          <button className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" onClick={() => setCheckoutOpen(false)} />
          <div className="relative z-10 w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-[17px] font-black text-slate-900">{t('checkout')}</h2>
              <button onClick={() => setCheckoutOpen(false)} className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                <X size={14} />
              </button>
            </div>
            <div className="grid gap-3">
              <Field label={t('phoneForLoyalty')} value={checkout.customerPhone} onChange={(e) => setCheckout({ ...checkout, customerPhone: e.target.value })} />
              <Field label={t('table')} value={tableId || ''} readOnly />
              <TextArea label={t('specialInstructions')} value={checkout.note} onChange={(e) => setCheckout({ ...checkout, note: e.target.value })} />
              <div className="grid grid-cols-[1fr_auto] items-end gap-2">
                <Field label="Coupon code" value={couponCode} onChange={(e) => setCouponCode(e.target.value.toUpperCase())} />
                <Button type="button" variant="outline" onClick={applyCoupon}>Apply</Button>
              </div>
              {discountAmount > 0 && <p className="m-0 rounded-xl bg-emerald-50 p-3 text-[12px] font-bold text-emerald-700">{coupon.code}: -{money(discountAmount)}</p>}
              <SelectField label={t('paymentMethod')} value={checkout.provider} onChange={(e) => setCheckout({ ...checkout, provider: e.target.value })}>
                {['DEMO', 'CASH', 'CARD', 'QPAY', 'QPay', 'SocialPay', 'MonPay'].map((p) => <option key={p}>{p}</option>)}
              </SelectField>
              <div className="flex justify-between rounded-2xl bg-amber-50 px-4 py-3 text-amber-700">
                <span className="text-[13px] font-semibold">{t('totalAmount')}</span>
                <span className="text-xl font-black">{money(total)}</span>
              </div>
              <button
                onClick={placeOrder}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-3.5 text-[14px] font-bold text-white hover:bg-slate-800"
              >
                <ShoppingCart size={15} /> {t('placeOrder')}
              </button>
              <div className="grid grid-cols-[1fr_auto] items-end gap-2">
                <SelectField label={t('serviceRequest')} value={waiter.requestType} onChange={(e) => setWaiter({ ...waiter, requestType: e.target.value })}>
                  {['CALL_WAITER', 'REQUEST_WATER', 'REQUEST_CUTLERY', 'REQUEST_BILL', 'CLEAN_TABLE'].map((t) => <option key={t}>{t}</option>)}
                </SelectField>
                <Button variant="outline" onClick={callWaiter}>{t('send')}</Button>
              </div>
              {message && <p className="m-0 rounded-xl bg-emerald-100 p-3 text-[12px] font-bold text-emerald-700">{message}</p>}
            </div>
          </div>
        </div>
      )}

      {serviceOpen && (
        <div className="fixed inset-0 z-50 grid place-items-end p-4 sm:place-items-center">
          <button className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" onClick={() => setServiceOpen(false)} />
          <div className="relative z-10 w-full max-w-sm rounded-3xl bg-white p-5 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-[17px] font-black text-slate-900">{t('service')}</h2>
                <p className="mt-0.5 text-[12px] font-medium text-slate-400">{t('table')} {tableId?.slice(0, 6)}</p>
              </div>
              <button onClick={() => setServiceOpen(false)} className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                <X size={14} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {serviceActions.map((action) => (
                <button
                  key={action.type}
                  type="button"
                  onClick={() => callWaiter(action.type, waiter.note)}
                  className="rounded-2xl border border-slate-100 bg-slate-50 px-3 py-3 text-left text-[12px] font-black text-slate-800 transition-colors hover:border-amber-300 hover:bg-amber-50"
                >
                  {action.label}
                </button>
              ))}
            </div>
            <div className="mt-4 grid gap-2">
              <TextArea label={t('note')} value={waiter.note} onChange={(e) => setWaiter({ ...waiter, note: e.target.value })} />
              <Button onClick={() => callWaiter(waiter.requestType, waiter.note)}><Bell size={13} /> {t('sendRequest')}</Button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
