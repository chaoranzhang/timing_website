from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import stripe
import os
from datetime import datetime
import json
import pickle

# Initialize FastAPI app
app = FastAPI(title="Payment API", version="1.0.0")

# CORS middleware to allow frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your actual domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration - Stripe secret key (keep this secret!)
STRIPE_SECRET_KEY = ""  # Your actual secret key
stripe.api_key = STRIPE_SECRET_KEY

# Simple file-based payment storage (no database needed)
PAYMENTS_FILE = "payments.pkl"

def load_payments():
    """Load payments from file"""
    try:
        if os.path.exists(PAYMENTS_FILE):
            with open(PAYMENTS_FILE, 'rb') as f:
                return pickle.load(f)
        return {}
    except Exception as e:
        print(f"Error loading payments: {e}")
        return {}

def save_payments(payments):
    """Save payments to file"""
    try:
        with open(PAYMENTS_FILE, 'wb') as f:
            pickle.dump(payments, f)
    except Exception as e:
        print(f"Error saving payments: {e}")

# Request model for checkout session
class CheckoutRequest(BaseModel):
    price: int = 99  # $0.99 in cents
    currency: str = "usd"
    language: str = "en"
    success_url: str
    cancel_url: str
    customer_email: str = None

# Response model for checkout session
class CheckoutResponse(BaseModel):
    id: str
    url: str

@app.post("/create-checkout-session", response_model=CheckoutResponse)
async def create_checkout_session(request: CheckoutRequest):
    """
    Create a Stripe checkout session for energy flow analysis payment
    """
    try:
        print(f"Received checkout request: price={request.price}, currency={request.currency}, language={request.language}")
        print(f"Customer email: {request.customer_email}")
        
        if request.customer_email:
            print(f"Will pre-fill email: {request.customer_email}")
        else:
            print("No customer email provided - will show empty email field")
        # Product name based on language
        product_name = {
            "en": "Energy Flow Analysis - 1 Year Access",
            "zh": "能量流分析 - 一年访问权限"
        }.get(request.language, "Energy Flow Analysis - 1 Year Access")
        
        # Product description based on language
        product_description = {
            "en": "Special event: 1 year access to energy flow analysis features",
            "zh": "特别活动：一年能量流分析功能访问权限"
        }.get(request.language, "Special event: 1 year access to energy flow analysis features")
        
        # Create checkout session with multiple payment methods
        checkout_session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            line_items=[{
                'price_data': {
                    'currency': request.currency,
                    'product_data': {
                        'name': product_name,
                        'description': product_description,
                        'metadata': {
                            'language': request.language,
                            'event_type': 'special_offer'
                        }
                    },
                    'unit_amount': request.price,  # $0.99 = 99 cents
                },
                'quantity': 1,
            }],
            mode='payment',
            success_url=request.success_url,
            cancel_url=request.cancel_url,
            metadata={
                'language': request.language,
                'product_type': 'energy_flow_analysis',
                'duration': '1_year',
                'event_type': 'special_offer'
            },
            customer_email=request.customer_email,  # Pre-fill email if provided
            allow_promotion_codes=True,  # Allow coupon codes
            billing_address_collection='auto',
            shipping_address_collection=None,  # No shipping needed for digital product
            # Remove email collection since user is already logged in
            customer_creation='if_required',  # Only create customer if needed
            # Remove wechat_pay since it's not enabled
        )
        
        print(f"Created checkout session: {checkout_session.id}")
        
        return CheckoutResponse(
            id=checkout_session.id,
            url=checkout_session.url
        )
        
    except stripe.error.StripeError as e:
        print(f"Stripe error: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Payment processing error: {str(e)}")
    except Exception as e:
        print(f"Unexpected error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.get("/check-payment-status/{session_id}")
async def check_payment_status(session_id: str):
    """
    Check the status of a payment session
    """
    try:
        session = stripe.checkout.Session.retrieve(session_id)
        return {
            "session_id": session.id,
            "payment_status": session.payment_status,
            "status": session.status,
            "amount_total": session.amount_total,
            "currency": session.currency,
            "customer_email": session.customer_details.email if session.customer_details else None,
            "created": datetime.fromtimestamp(session.created).isoformat()
        }
    except stripe.error.StripeError as e:
        raise HTTPException(status_code=400, detail=f"Error retrieving session: {str(e)}")

@app.post("/webhook")
async def stripe_webhook(request: Request):
    """
    Handle Stripe webhooks for payment events
    """
    try:
        # Get the webhook payload
        payload = await request.body()
        sig_header = request.headers.get('stripe-signature')
        
        # Webhook secret - you'll get this from Stripe Dashboard
        webhook_secret = "whsec_YOUR_WEBHOOK_SECRET"  # Replace with your actual webhook secret from Stripe Dashboard
        
        try:
            event = stripe.Webhook.construct_event(
                payload, sig_header, webhook_secret
            )
        except ValueError as e:
            raise HTTPException(status_code=400, detail="Invalid payload")
        except stripe.error.SignatureVerificationError as e:
            raise HTTPException(status_code=400, detail="Invalid signature")
        
        # Handle the event
        if event['type'] == 'checkout.session.completed':
            session = event['data']['object']
            await handle_successful_payment(session)
        elif event['type'] == 'payment_intent.succeeded':
            payment_intent = event['data']['object']
            print(f"Payment succeeded: {payment_intent.id}")
        elif event['type'] == 'payment_intent.payment_failed':
            payment_intent = event['data']['object']
            print(f"Payment failed: {payment_intent.id}")
        
        return {"status": "success"}
        
    except Exception as e:
        print(f"Webhook error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

async def handle_successful_payment(session):
    """
    Handle successful payment completion
    """
    try:
        print(f"Payment completed for session: {session.id}")
        customer_email = session.customer_details.email if session.customer_details else None
        print(f"Customer email: {customer_email}")
        print(f"Amount: {session.amount_total} {session.currency}")
        print(f"Metadata: {session.metadata}")
        
        # Store payment in file-based system
        payments = load_payments()
        
        payment_data = {
            "session_id": session.id,
            "customer_email": customer_email,
            "amount": session.amount_total,
            "currency": session.currency,
            "payment_status": session.payment_status,
            "metadata": session.metadata,
            "timestamp": datetime.now().isoformat(),
            "paid": True
        }
        
        # Store by email if available, otherwise by session ID
        key = customer_email if customer_email else session.id
        payments[key] = payment_data
        
        save_payments(payments)
        print(f"Payment stored for: {key}")
        print(f"Payment data: {json.dumps(payment_data, indent=2)}")
        
    except Exception as e:
        print(f"Error handling successful payment: {str(e)}")

@app.get("/verify-payment/{email}")
async def verify_payment(email: str):
    """
    Verify if a user has paid
    """
    try:
        payments = load_payments()
        payment = payments.get(email)
        
        if payment and payment.get("paid"):
            return {
                "paid": True,
                "amount": payment.get("amount"),
                "currency": payment.get("currency"),
                "timestamp": payment.get("timestamp")
            }
        else:
            return {"paid": False}
            
    except Exception as e:
        print(f"Error verifying payment: {e}")
        return {"paid": False, "error": str(e)}

@app.get("/health")
async def health_check():
    """
    Health check endpoint
    """
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

@app.get("/success")
async def payment_success():
    """
    Payment success redirect endpoint
    """
    return {"message": "Payment successful! You can close this window and return to the main page."}

@app.get("/cancel")
async def payment_cancel():
    """
    Payment cancel redirect endpoint
    """
    return {"message": "Payment cancelled. You can close this window and return to the main page."}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 