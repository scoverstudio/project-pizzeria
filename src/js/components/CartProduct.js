import {
    select
} from "../settings.js";

import AmountWidget from "../components/AmountWidget.js";

class CartProduct {
    constructor(menuProduct, element) {
        const thisCartProduct = this;
        thisCartProduct.id = menuProduct.id;
        thisCartProduct.name = menuProduct.name;
        thisCartProduct.amount = menuProduct.amount;
        thisCartProduct.priceSingle = menuProduct.priceSingle;
        thisCartProduct.price = menuProduct.price;
        thisCartProduct.params = menuProduct.params;

        thisCartProduct.getElements(element);
        thisCartProduct.initAmountWidget();
        thisCartProduct.initActions();
    }

    getElements(element) {
        const thisCartProduct = this;

        thisCartProduct.dom = {};

        thisCartProduct.dom.wrapper = element;
        thisCartProduct.dom.amountWidget =
            thisCartProduct.dom.wrapper.querySelector(
                select.cartProduct.amountWidget
            );
        thisCartProduct.dom.price = thisCartProduct.dom.wrapper.querySelector(
            select.cartProduct.price
        );
        thisCartProduct.dom.edit = thisCartProduct.dom.wrapper.querySelector(
            select.cartProduct.edit
        );
        thisCartProduct.dom.remove = thisCartProduct.dom.wrapper.querySelector(
            select.cartProduct.remove
        );
    }

    initAmountWidget() {
        const thisCartProduct = this;

        thisCartProduct.amountWidget = new AmountWidget(
            thisCartProduct.dom.amountWidget
        );
        thisCartProduct.dom.amountWidget.addEventListener(
            "updated",
            function () {
                thisCartProduct.price =
                    thisCartProduct.priceSingle * thisCartProduct.amountWidget.value;
                thisCartProduct.dom.price.innerHTML = thisCartProduct.price;
            }
        );
    }
    remove() {
        const thisCartProduct = this;

        const event = new CustomEvent('remove', {
            bubbles: true,
            detail: {
                cartProduct: thisCartProduct,
            },
        });

        thisCartProduct.dom.wrapper.dispatchEvent(event);
    }

    initActions() {
        const thisCartProduct = this;

        thisCartProduct.dom.remove.addEventListener('click', function (eventR) {
            eventR.preventDefault();
            thisCartProduct.remove();
        });
        thisCartProduct.dom.edit.addEventListener('click', function (eventR) {
            eventR.preventDefault();
        });
    }

    getData() {
        const thisCartProduct = this;

        const productSummary = {
            id: thisCartProduct.id,
            name: thisCartProduct.name,
            amount: thisCartProduct.amountWidget.value,
            priceSingle: thisCartProduct.priceSingle,
            price: thisCartProduct.priceSingle * thisCartProduct.amountWidget.value,
            params: thisCartProduct.params
        };
        return productSummary;
    }
}

export default CartProduct;