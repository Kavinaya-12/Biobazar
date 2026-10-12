import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import './storefront-pages.css'
import { Provider } from 'react-redux'
import store from './redux/store.js'
import { logout, restoreSession, sessionChecking } from './redux/authSlice.js'
import { clearCart } from './redux/cartSlice.js'
import { clearWishlist } from './redux/wishlistSlice.js'

const clearPrivateSession = () => {
  store.dispatch(logout())
  store.dispatch(clearCart())
  store.dispatch(clearWishlist())
}

window.addEventListener('biobazaar:session-invalid', (event) => {
  const invalidToken = event.detail?.token
  if (!invalidToken || store.getState().auth.token !== invalidToken) return
  clearPrivateSession()
})
window.addEventListener('storage', (event) => {
  if (event.key !== 'token') return
  if (!event.newValue) clearPrivateSession()
  else {
    store.dispatch(sessionChecking())
    store.dispatch(clearCart())
    store.dispatch(clearWishlist())
    store.dispatch(restoreSession())
  }
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <Provider store={store}>
    <App />
  </Provider>,
)
