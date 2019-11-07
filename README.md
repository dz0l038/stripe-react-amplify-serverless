
## Implement the stripe checkout workflow with a react amplify project
Stripe checkout is probably the fastest way to accept payment in your website. However, even if the stripe doc is well done (https://stripe.com/docs/payments/checkout), having it fully integrated in your react amplify project can be slightly tricky. At the end of the tutorial we will have a simple "pay" button component redirecting Stripe.

### Assumptions
You have a react app running with amplify already init.
You have a Stripe account and know your private and public keys.
I used material-ui for the button so you'll also need it if you copy past the code, however it is pretty easy to replace it with whatever you want.

### How it work
Stripe checkout work this way:
-> The client send a checkout session request to our backend (lambda here).
-> Using our private key, this backend can ask Stripe to setup a checkout page on Stripe website and return the session id to the client.
-> When the client received the session id, he can be redirected to the corresponding page on Stripe to proceed to the payment.
-> After payment the client is redirected to a confirmation page on your website (or a cancel page)--

Pretty simple right! So lets implement is!

### First setting up the backend
As we want the process to be serverless, the first thing to do is to create a endpoint on a lambda to ask Stripe to create a checkout session.
We ll do that in Amplify by creating a new REST api with endpoint using express.
```
amplify add api
```
then answer as follow:
```
? Please select from one of the below mentioned services REST
? Provide a friendly name for your resource to be used as a label for this category in the project: stripeapi
? Provide a path (e.g., /items) /checkout
? Choose a Lambda source Create a new Lambda function
? Provide a friendly name for your resource to be used as a label for this category in the project: stripeCheckout
? Provide the AWS Lambda function name: stripeCheckout
? Choose the function template that you want to use: Serverless express function (Integration with Amazon API Gateway)
? Do you want to access other resources created in this project from your Lambda function? No
? Do you want to edit the local lambda function now? No
Succesfully added the Lambda function locally
? Restrict API access (Y/n) No
```

In amplify/backend, you should see a new api and a new function.
Go in amplify/backend/funtion/stripeCheckout/src.

In app.js you can see all methods accepted in this endpoint. We are going to implement a POST method here.
Open a terminal in the function src folder and
```
npm install stripe
```
Now you can import stripe in this file:
```
const stripe = require('stripe')('sk_test_************'); <-- Your private stripe key 
```


Then we create a simple post method asking Stripe to create a checkout session with our parameters (name, description, amount, images, currency, quantity and redirect urls) that we are going to pass through therequest. The session object generated will be return to the user so he can access the checkout session with the id.
(don't forget the async ;))
```
app.post('/checkout', async function (req, res) {
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        name: req.body.name,
        description: req.body.description,
        images: req.body.images,
        amount: req.body.amount,
        currency: req.body.currency,
        quantity: req.body.quantity,
      }],
      success_url: req.body.success_url,
      cancel_url: req.body.cancel_url,
    });
    res.json({ err: null, success: 'Create stripe checkout session succeed!', session })
  } catch (err) {
    res.json({ err: err })
  }
});
```

The backend is done now, fast right!
Push it:
```
amplify push
```

### The front end
First you ll need to add this line in public/index.html
```
<script src="https://js.stripe.com/v3/"></script>
```
Then you can copy past the code in this repo, this is a simple component displaying a button and making the call to the backend that you can call this way:
```
<PayButton
    stripePublicKey="pk_test_********"
    apiName="stripeapi"
    apiEndpoint="/checkout"
    name='T-shirt'
    description='Comfortable cotton t-shirt'
    images={['http://lorempixel.com/400/200/']}
    amount={550}
    currency='usd'
    quantity={1}
    success_url='https://example.com/success?session_id={CHECKOUT_SESSION_ID}' // Where to redirect if success
    cancel_url='https://example.com/cancel' // Where to go if payment canceled
/>
```
You can make your own implementation pretty easily, without going into details here are some guidelines:
You will need to `import { Elements, StripeProvider } from 'react-stripe-elements';` in a parent component to wrap the component acctualy using Stripe:
```
<StripeProvider apiKey={stripePublicKey}>
    <Elements>
        <PayButtonContent
            apiName={apiName}
            apiEndpoint={apiEndpoint}
            name={name}
            description={description}
            images={images}
            amount={amount}
            currency={currency}
            quantity={quantity}
            success_url={success_url}
            cancel_url={cancel_url}
            onClick={this.onClickPay}
            onFail={this.onPayFail}
        />
    </Elements>
</StripeProvider>
```
In the child element you need to inject Stripe to access it though the props
```
import { API } from 'aws-amplify';
import { injectStripe } from 'react-stripe-elements';
```
```
export default injectStripe(PayButtonContent);
```
You can now implement a simple button that mak this call when clicked:
```
async handlePay() {
    const body = {
        name: this.props.name,
        description: this.props.description,
        images: this.props.images,
        amount: this.props.amount,
        currency: this.props.currency,
        quantity: this.props.quantity,
        success_url: this.props.success_url,
        cancel_url: this.props.cancel_url,
    }
    const response = await API.post(this.props.apiName, this.props.apiEndpoint, { body })
    this.props.stripe.redirectToCheckout({
        // Make the id field from the Checkout Session creation API response
        // available to this file, so you can provide it as parameter here
        // instead of the {{CHECKOUT_SESSION_ID}} placeholder.
        sessionId: response.session.id
    }).then(function (result) {
        // If `redirectToCheckout` fails due to a browser or network
        // error, display the localized error message to your customer
        // using `result.error.message`.
    });
}
```
Congrats! You now can accept payment on your website :)
