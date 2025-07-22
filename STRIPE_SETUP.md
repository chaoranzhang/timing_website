# Stripe Integration Setup Guide

## 🔧 Configuration Setup

### Step 1: Get Your Stripe Keys

1. **Log into your Stripe Dashboard** at https://dashboard.stripe.com
2. **Go to Developers → API Keys**
3. **Copy your keys**:
   - **Publishable Key** (starts with `pk_test_` for test mode)
   - **Secret Key** (starts with `sk_test_` for test mode)

### Step 2: Configure Your Keys

1. **Copy the template file**:
   ```bash
   cp config.template.js config.js
   ```

2. **Edit `config.js`** and replace the placeholder values:
   ```javascript
   STRIPE_PUBLISHABLE_KEY: 'pk_test_YOUR_ACTUAL_PUBLISHABLE_KEY',
   STRIPE_SECRET_KEY: 'sk_test_YOUR_ACTUAL_SECRET_KEY',
   ```

### Step 3: Environment Management

#### For Development:
- Use `config.js` with test keys
- Set `ENVIRONMENT: 'development'`

#### For Production:
- Use `config.js` with live keys
- Set `ENVIRONMENT: 'production'`
- Change `pk_test_` to `pk_live_`
- Change `sk_test_` to `sk_live_`

### Step 4: Security Best Practices

✅ **Never commit `config.js` to version control**  
✅ **Use test keys for development**  
✅ **Use live keys only in production**  
✅ **Keep your secret key secure** (only use in backend)  

## 🔑 Key Files

- `config.template.js` - Template with placeholder values
- `config.js` - Your actual configuration (not in git)
- `.gitignore` - Prevents sensitive files from being committed
- `assets/js/payment-page.js` - Uses configuration values

## 🚀 Testing

1. **Use Stripe Test Cards**:
   - **Success**: `4242 4242 4242 4242`
   - **Decline**: `4000 0000 0000 0002`
   - **Any future date** and **any 3-digit CVC**

2. **Test the Flow**:
   - Click "Claim Offer" on payment page
   - Should redirect to Stripe Checkout
   - Complete payment with test card
   - Should redirect to success page

## 🔄 Going Live

When ready for production:

1. **Switch to Live Keys** in `config.js`
2. **Update `ENVIRONMENT`** to `'production'`
3. **Set up webhooks** for production
4. **Test with real cards** (small amounts first)

## 📝 Configuration Options

```javascript
const CONFIG = {
    // Stripe Keys
    STRIPE_PUBLISHABLE_KEY: 'pk_test_...',
    STRIPE_SECRET_KEY: 'sk_test_...',
    
    // Backend API
    API_BASE_URL: 'https://your-backend.com',
    
    // Payment Settings
    PAYMENT_AMOUNT: 99, // $0.99 in cents
    PAYMENT_CURRENCY: 'usd',
    PAYMENT_DESCRIPTION: 'Energy Flow Analysis - 1 Year Access',
    
    // Environment
    ENVIRONMENT: 'development', // or 'production'
    
    // URLs
    SUCCESS_URL: '/payment-success.html',
    CANCEL_URL: '/payment.html'
};
```

## 🛠️ Backend Requirements

Your backend needs a `/create-checkout-session` endpoint that:

1. **Receives payment request** from frontend
2. **Creates Stripe Checkout Session** using secret key
3. **Returns session ID** to frontend

Example backend code available in the main setup instructions. 