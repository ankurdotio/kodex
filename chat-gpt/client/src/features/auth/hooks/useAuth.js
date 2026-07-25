import { useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { authService } from '../service/authService'
import {
    authBootstrapDone,
    authFailure,
    authStart,
    authSuccess,
    clearAuthError,
    logoutSuccess,
    tokenUpdated,
} from '../state/authSlice'
import { clearSessions } from '../../chat/state/sessionSlice'
import { setAccessToken } from '../../../shared/service/httpClient'

let bootstrapPromise = null

function parseError(error) {
    return error?.response?.data?.message || 'Something went wrong'
}

export function useAuth() {
    const dispatch = useDispatch()
    const authState = useSelector((state) => state.auth)

    const register = useCallback(
        async (payload) => {
            dispatch(authStart())
            try {
                const { data: resBody } = await authService.register(payload)
                const payloadData = resBody.data
                setAccessToken(payloadData.accessToken)
                dispatch(authSuccess({ user: payloadData.user, accessToken: payloadData.accessToken }))
                return { ok: true, data: resBody }
            } catch (error) {
                const message = parseError(error)
                dispatch(authFailure(message))
                return { ok: false, message }
            }
        },
        [ dispatch ],
    )

    const login = useCallback(
        async (payload) => {
            dispatch(authStart())
            try {
                const { data: resBody } = await authService.login(payload)
                const payloadData = resBody.data
                setAccessToken(payloadData.accessToken)
                dispatch(authSuccess({ user: payloadData.user, accessToken: payloadData.accessToken }))
                return { ok: true, data: resBody }
            } catch (error) {
                const message = parseError(error)
                dispatch(authFailure(message))
                return { ok: false, message }
            }
        },
        [ dispatch ],
    )

    const refresh = useCallback(async () => {
        try {
            const { data: resBody } = await authService.refreshToken()
            const payloadData = resBody.data
            setAccessToken(payloadData.accessToken)
            dispatch(tokenUpdated({ accessToken: payloadData.accessToken, user: payloadData.user }))
            return true
        } catch {
            setAccessToken(null)
            dispatch(logoutSuccess())
            dispatch(clearSessions())
            return false
        }
    }, [ dispatch ])

    const bootstrapSession = useCallback(async () => {
        if (authState.initialized) {
            return authState.isAuthenticated
        }

        if (!bootstrapPromise) {
            bootstrapPromise = (async () => {
                try {
                    const { data: resBody } = await authService.refreshToken()
                    const payloadData = resBody.data
                    setAccessToken(payloadData.accessToken)
                    dispatch(authSuccess({ user: payloadData.user, accessToken: payloadData.accessToken }))
                    return true
                } catch {
                    setAccessToken(null)
                    dispatch(logoutSuccess())
                    dispatch(clearSessions())
                    return false
                } finally {
                    dispatch(authBootstrapDone())
                    bootstrapPromise = null
                }
            })()
        }

        return bootstrapPromise
    }, [ authState.initialized, authState.isAuthenticated, dispatch ])

    const logout = useCallback(async () => {
        try {
            await authService.logout()
        } finally {
            setAccessToken(null)
            dispatch(logoutSuccess())
            dispatch(clearSessions())
        }
    }, [ dispatch ])

    const forgotPassword = useCallback(
        async (payload) => {
            dispatch(authStart())
            try {
                const { data: resBody } = await authService.forgotPassword(payload)
                dispatch(clearAuthError())
                return { ok: true, data: resBody }
            } catch (error) {
                const message = parseError(error)
                dispatch(authFailure(message))
                return { ok: false, message }
            }
        },
        [ dispatch ],
    )

    const resetPassword = useCallback(
        async (payload) => {
            dispatch(authStart())
            try {
                const { data: resBody } = await authService.resetPassword(payload)
                dispatch(clearAuthError())
                return { ok: true, data: resBody }
            } catch (error) {
                const message = parseError(error)
                dispatch(authFailure(message))
                return { ok: false, message }
            }
        },
        [ dispatch ],
    )

    const verifyEmail = useCallback(
        async (payload) => {
            dispatch(authStart())
            try {
                const { data: resBody } = await authService.verifyEmail(payload)
                const payloadData = resBody.data
                if (payloadData && payloadData.accessToken) {
                    setAccessToken(payloadData.accessToken)
                    dispatch(authSuccess({ user: payloadData.user, accessToken: payloadData.accessToken }))
                }
                return { ok: true, message: resBody.message }
            } catch (error) {
                const message = parseError(error)
                dispatch(authFailure(message))
                return { ok: false, message }
            }
        },
        [ dispatch ],
    )

    const resendVerification = useCallback(
        async (payload) => {
            try {
                const { data: resBody } = await authService.resendVerification(payload)
                return { ok: true, message: resBody.message }
            } catch (error) {
                const message = parseError(error)
                return { ok: false, message }
            }
        },
        [],
    )

    return {
        ...authState,
        register,
        login,
        logout,
        refresh,
        bootstrapSession,
        forgotPassword,
        resetPassword,
        verifyEmail,
        resendVerification,
        clearError: () => dispatch(clearAuthError()),
    }
}
