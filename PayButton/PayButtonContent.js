import React, { Component } from 'react';
import './PayButton.scss';
import { Button } from '@material-ui/core';
import PropTypes from 'prop-types';
import { API } from 'aws-amplify';
import {
    injectStripe,
} from 'react-stripe-elements';

class PayButtonContent extends Component {
    constructor() {
        super();
        this.handlePay = this.handlePay.bind(this)
    }

    async handlePay() {
        if (this.props.onClickPay) this.props.onClickPay();
        console.log(this.props.images)
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
            if (this.props.onPayFail) this.props.onPayFail();
        });
    }

    render() {
        const { disabled, amount, currency } = this.props;
        return (
            <Button onClick={this.handlePay} disabled={disabled} variant="contained" color="secondary">Pay ({parseFloat(Math.round(amount) / 100).toFixed(2)} {currency})</Button>
        );
    }
}

PayButtonContent.propTypes = {
    apiName: PropTypes.string.isRequired,
    apiEndpoint: PropTypes.string.isRequired,

    name: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
    images: PropTypes.array.isRequired,
    amount: PropTypes.number.isRequired,
    currency: PropTypes.string.isRequired,
    quantity: PropTypes.number.isRequired,

    success_url: PropTypes.string.isRequired,
    cancel_url: PropTypes.string.isRequired,

    onClick: PropTypes.func,
    onFail: PropTypes.func,

    disabled: PropTypes.bool,
};

export default injectStripe(PayButtonContent);