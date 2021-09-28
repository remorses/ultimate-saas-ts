import conf from '@app/config'
import { stripe } from '@app/utils/ssr'
import { getCustomerId } from '@app/utils/ssr/stripe'
import { NextApiHandler } from 'next'
import { getSession } from 'next-auth/react'
import { getContext } from 'next-rpc/context'

export const config = { rpc: true } // enable rpc on this API route

export const createCheckoutSession = async ({
    priceId,
    quantity = 1,
    metadata = {},
}) => {
    if (!priceId) {
        throw new Error('Missing parameter price')
    }

    const { req, res } = getContext()
    
    const session = await getSession({ req })
    if (!session || !session.user?.id) {
        throw new Error('Forbidden')
    }
    const userId = session.user.id

    const customerId = await getCustomerId(userId)

    const checkoutSession = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        billing_address_collection: 'required',
        customer: customerId,
        client_reference_id: userId,
        line_items: [
            {
                price: priceId,
                quantity: 1,
            },
        ],
        mode: 'subscription',

        allow_promotion_codes: true,
        subscription_data: {
            trial_from_plan: true,
            // TODO trial period goes here
            // trial_period_days
            metadata: {},
        },
        success_url: `${conf.NEXTAUTH_URL}/account`,
        cancel_url: `${conf.NEXTAUTH_URL}/`,
    })

    return { sessionId: checkoutSession.id }
}
