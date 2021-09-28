import conf from '@app/config'
import { stripe } from '@app/utils/ssr'
import { getCustomerId } from '@app/utils/ssr/stripe'
import { getSession } from 'next-auth/react'
import { getContext } from 'next-rpc/context'

export const config = { rpc: true } // enable rpc on this API route

export const createPortal = async ({}) => {
    const { req, res } = getContext()

    const session = await getSession({ req })
    if (!session || !session.user?.id) {
        throw new Error('Forbidden')
    }
    const userId = session.user.id
    const customerId = await getCustomerId(userId)

    const { url } = await stripe.billingPortal.sessions.create({
        customer: customerId,

        return_url: `${conf.NEXTAUTH_URL}/account`,
    })

    return { url }
}


