
import { loadStripe } from '@stripe/stripe-js';
import { placeOrder } from './apiService';

export async function initStripe() {
    const stripe = await loadStripe('pk_test_51HouOLBr5tPFatsjUdgVzEKXTIFP7NJ6Q3NjN3fK641o8BgppY7JeRiz9MOZHok9YtPtEd6eI8sr7PqcGnvRIwZF00fSbSd29f');
    var card = null
    function mountWidget() {
        const elements = stripe.elements()
        let style = {
            base: {
                color: '#32325d',
                fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
                fontSmoothing: 'antialiased',
                fontSize: '16px',
                '::placeholder': { color: '#aab7c4' }
            },
            invalid: {
                color: '#fa755a',
                iconColor: '#fa7551'
            }
        };
        card = elements.create('card', { style, hidePostalCode: true })
        card.mount('#card-element')

    }
    //payment
    const paymentType = document.querySelector('#paymentType')

    if (!paymentType) {
        return;
    }
    paymentType.addEventListener('change', (e) => {
        if (e.target.value === 'card') {
            //display widget
            mountWidget()
        } else {
            //nothing to display
            card.destroy()
        }
    })

    //Ajax call
    const paymentForm = document.querySelector('#payment-form')
    if (paymentForm) {
        paymentForm.addEventListener('submit', (e) => {
            e.preventDefault(); // not submit form on '/order'
            let formData = new FormData(paymentForm)
            let formObject = {}
            for (let [key, value] of formData.entries()) {
                formObject[key] = value
            }

            if (!card) {
                placeOrder(formObject);
                console.log(formObject)
                return;
            }
            //verify card
            stripe.createToken(card).then((result) => {
                //  console.log(result)
                formObject.stripeToken = result.token.id;
                placeOrder(formObject);
            }).catch((err) => {
                console.log(err)
            })




            console.log(formObject)

        })
    }




}