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
                const { data } = await authService.register(payload)
                setAccessToken(data.accessToken)
                dispatch(authSuccess({ user: data.user, accessToken: data.accessToken }))
                return { ok: true, data }
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
                const { data } = await authService.login(payload)
                setAccessToken(data.accessToken)
                dispatch(authSuccess({ user: data.user, accessToken: data.accessToken }))
                return { ok: true, data }
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
            const { data } = await authService.refreshToken()
            if (!data?.accessToken) {
                setAccessToken(null)
                dispatch(logoutSuccess())
                dispatch(clearSessions())
                return false
            }
            setAccessToken(data.accessToken)
            dispatch(tokenUpdated({ accessToken: data.accessToken, user: data.user }))
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
                    const { data } = await authService.refreshToken()
                    if (!data?.accessToken) {
                        setAccessToken(null)
                        dispatch(logoutSuccess())
                        dispatch(clearSessions())
                        return false
                    }
                    setAccessToken(data.accessToken)
                    dispatch(authSuccess({ user: data.user, accessToken: data.accessToken }))
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
                const { data } = await authService.forgotPassword(payload)
                dispatch(clearAuthError())
                return { ok: true, data }
            } catch (error) {
                const message = parseError(error)
                dispatch(authFailure(message))
                return { ok: false, message }
            }
        },
        [ dispatch ],
    )

    return {
        ...authState,
        register,
        login,
        logout,
        refresh,
        bootstrapSession,
        forgotPassword,
        clearError: () => dispatch(clearAuthError()),
    }
}
