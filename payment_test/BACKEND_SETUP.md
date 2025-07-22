# Payment Backend Setup Guide

## 🚀 Quick Start

### Step 1: Install Dependencies

```bash
cd payment_test
pip install -r requirements.txt
```

### Step 2: Update Stripe Secret Key

Edit `payment_api.py` and replace the placeholder:

```python
# Line 20: Replace with your actual secret key
STRIPE_SECRET_KEY = "sk_test_YOUR_ACTUAL_SECRET_KEY_HERE"
```

### Step 3: Start the Server

```bash
python start_payment_api.py
```

The server will start at `http://localhost:8000`

## 📋 API Endpoints

### 1. Create Checkout Session
- **POST** `/create-checkout-session`
- **Purpose**: Creates a Stripe checkout session for payment
- **Request Body**:
  ```json
  {
    "price": 99,
    "currency": "usd",
    "language": "en",
    "success_url": "https://your-domain.com/payment-success.html?lang=en",
    "cancel_url": "https://your-domain.com/payment.html?lang=en"
  }
  ```

### 2. Check Payment Status
- **GET** `/check-payment-status/{session_id}`
- **Purpose**: Check the status of a payment session

### 3. Webhook Handler
- **POST** `/webhook`
- **Purpose**: Handle Stripe webhook events

### 4. Health Check
- **GET** `/health`
- **Purpose**: Check if the API is running

## 🔧 Configuration

### Environment Variables (Optional)

You can use environment variables instead of hardcoding:

```python
import os

STRIPE_SECRET_KEY = os.getenv('STRIPE_SECRET_KEY', 'sk_test_YOUR_SECRET_KEY_HERE')
```

### CORS Settings

The API allows all origins for development. For production, update:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://your-domain.com"],  # Your actual domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## 🧪 Testing

### Test the API

1. **Start the server**:
   ```bash
   python start_payment_api.py
   ```

2. **Check health**:
   ```bash
   curl http://localhost:8000/health
   ```

3. **Create checkout session**:
   ```bash
   curl -X POST http://localhost:8000/create-checkout-session \
     -H "Content-Type: application/json" \
     -d '{
       "price": 99,
       "currency": "usd",
       "language": "en",
       "success_url": "http://localhost:3000/payment-success.html?lang=en",
       "cancel_url": "http://localhost:3000/payment.html?lang=en"
     }'
   ```

### Test with Frontend

1. **Update your frontend config** to point to local backend:
   ```javascript
   // In config.js
   API_BASE_URL: 'http://localhost:8000'
   ```

2. **Click "Claim Offer"** on your payment page
3. **Should redirect to Stripe Checkout**

## 🔒 Security

### Webhook Verification

For production, set up webhook verification:

1. **Get webhook secret** from Stripe Dashboard
2. **Update webhook secret** in `payment_api.py`:
   ```python
   webhook_secret = "whsec_YOUR_ACTUAL_WEBHOOK_SECRET"
   ```

### Production Deployment

1. **Use environment variables** for sensitive data
2. **Set up proper CORS** for your domain
3. **Use HTTPS** in production
4. **Set up webhooks** for payment events

## 📊 Monitoring

The API includes logging for:
- ✅ Checkout session creation
- ✅ Payment completion
- ✅ Webhook events
- ✅ Errors and exceptions

## 🚀 Deployment

### Local Development
```bash
python start_payment_api.py
```

### Production (with Gunicorn)
```bash
pip install gunicorn
gunicorn payment_api:app -w 4 -k uvicorn.workers.UvicornWorker
```

### Docker (Optional)
```dockerfile
FROM python:3.9
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["python", "start_payment_api.py"]
```

## 🔗 Integration with Frontend

Your frontend is already configured to work with this backend:

1. **Frontend calls** `/create-checkout-session`
2. **Backend creates** Stripe checkout session
3. **Frontend redirects** to Stripe Checkout
4. **User completes payment** on Stripe
5. **Stripe redirects** to success page

## 📝 Next Steps

1. ✅ **Install dependencies**
2. ✅ **Update Stripe secret key**
3. ✅ **Start the server**
4. ✅ **Test with frontend**
5. 🔄 **Set up webhooks** (optional)
6. 🔄 **Deploy to production** (when ready) 



