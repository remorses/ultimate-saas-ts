import { NextApiRequest } from 'next'
import { DefaultSession, Session } from 'next-auth'
import { DefaultJWT } from 'next-auth/jwt'

export interface AppNextApiRequest extends NextApiRequest {
    session?: Session & {
        userId?: string
    }
}

declare module 'next-auth' {
    /**
     * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
     */
    interface Session extends DefaultSession {
        user: {
            /** The user's postal address. */
            id: string
        }
    }
}

declare module 'next-auth/jwt' {
    /** Returned by the `jwt` callback and `getToken`, when using JWT sessions */
    interface JWT extends DefaultJWT {
        /** OpenID ID Token */
        userId: string
    }
}
