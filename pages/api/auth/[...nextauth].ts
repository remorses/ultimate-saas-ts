import type { PrismaClient, Prisma } from '@prisma/client'
import type { Adapter } from 'next-auth/adapters'
import { NextApiHandler } from 'next'
import NextAuth, { NextAuthOptions } from 'next-auth'
import EmailProvider from 'next-auth/providers/email'
import GoogleProvider from 'next-auth/providers/google'
import { pretty } from '@app/utils'

import config from '@app/config'
import { prisma } from '@app/utils/ssr'

const options: NextAuthOptions = {
    providers: [
        GoogleProvider({
            clientId: config.GOOGLE_ID!,
            clientSecret: config.GOOGLE_SECRET!,
        }),
        // EmailProvider({
        //     server: config.SMTP_SERVER,
        //     from: config.SMTP_FROM,
        // }),
    ],
    adapter: PrismaAdapter(prisma) as any,

    jwt: {
        secret: process.env.SECRET,

    },
    session: {
        jwt: true,
    },
    secret: config.SECRET,
    callbacks: {
        async jwt({ token, account, isNewUser, user, profile }) {
            // TODO new jwt created at every browser refresh
            // jwt happens before session, it has access to many provider stuff on first sign up
            console.log(
                'jwt',
                pretty({ token, account, isNewUser, user, profile }),
            )
            if (user) {
              // TODO to modify a jwt i need to force the user to sign out to generate new one, 
                token.userId = user.id
            }
            return token
        },
        async session({ session, user, token }) {
            // session happens after jwt, can modify the data passed to useSession hook
            // when using jwt the user field is always missing, instead you have token
            console.log('session', pretty({ token, user, session }))
            // session.userId = user.id
            session.user.id = token.userId
            return session
        },
    },
}

const authHandler: NextApiHandler = (req, res) => NextAuth(req, res, options)

export default authHandler

export function PrismaAdapter(prisma: PrismaClient): Partial<Adapter> {
    return {
        createUser(data) {
            return prisma.user.create({ data })
        },
        getUser(id) {
            return prisma.user.findUnique({ where: { id } })
        },
        getUserByEmail(email) {
            return prisma.user.findUnique({ where: { email } })
        },
        async getUserByAccount(provider_providerAccountId) {
            const account = await prisma.account.findUnique({
                where: { provider_providerAccountId },
                select: { user: true },
            })
            return account?.user ?? null
        },
        updateUser(data) {
            return prisma.user.update({ where: { id: data.id }, data })
        },
        deleteUser(id) {
            return prisma.user.delete({ where: { id } })
        },
        linkAccount(data) {
            console.log('account', pretty(data))
            return prisma.account.create({ data }) as any // TODO fix linkAccount return type
        },
        unlinkAccount(provider_providerAccountId) {
            return prisma.account.delete({
                where: { provider_providerAccountId },
            }) as any
        },
        // async getSessionAndUser(sessionToken) {
        //     const userAndSession = await prisma.session.findUnique({
        //         where: { sessionToken },
        //         include: { user: true },
        //     })
        //     if (!userAndSession) return null
        //     const { user, ...session } = userAndSession
        //     return { user, session }
        // },
        // createSession: (data) => prisma.session.create({ data }),
        // updateSession: (data) =>
        //     prisma.session.update({
        //         data,
        //         where: { sessionToken: data.sessionToken },
        //     }),
        // deleteSession: (sessionToken) =>
        //     prisma.session.delete({ where: { sessionToken } }),
        createVerificationToken(data) {
            return prisma.verificationToken.create({ data })
        },
        async useVerificationToken(identifier_token) {
            try {
                return await prisma.verificationToken.delete({
                    where: { identifier_token },
                })
            } catch (error) {
                // If token already used/deleted, just return null
                // https://www.prisma.io/docs/reference/api-reference/error-reference#p2025
                if (
                    (error as Prisma.PrismaClientKnownRequestError).code ===
                    'P2025'
                )
                    return null
                throw error
            }
        },
    }
}
