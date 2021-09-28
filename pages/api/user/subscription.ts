import { prisma, stripe } from '@app/utils/ssr'
import { getSession } from 'next-auth/react'
import { getContext } from 'next-rpc/context'

export const config = { rpc: true } // enable rpc on this API route

export const getSubscription = async ({}) => {
    const { req, res } = getContext()
    const session = await getSession({ req })
    if (!session || !session.user?.id) {
        throw new Error('Forbidden')
    }
    const userId = session.user.id

    const subscription = await prisma.subscription?.findFirst({
        where: {
            userId: userId,
            status: {
                in: ['active', 'trialing'],
            },
        },
    })

    return { subscription }
}
