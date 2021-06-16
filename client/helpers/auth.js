import cookie from 'js-cookie';
import Router from 'next/router';

// set in cookie
export const setCookie = (key, value) => {
    if(process.browser) {
         // nextjs for client side
         cookie.set(key, value, {
             expires: 7 //will expire in 7 days to match jwt
         })
    }
}

// remove from cookie
export const removeCookie = (key) => {
    if(process.browser) {
         cookie.remove(key)
    }
}

// get from cookie such as stored token
// will be useful when we need to make a request to server with auth token
export const getCookie = (key, req) => {
    // if(process.browser) {
    //     return cookie.get(key)
    // }
    return process.browser ? getCookieFromBrowser(key) : getCookieFromServer(key, req);
}

export const getCookieFromBrowser = (key) => {
    return cookie.get(key);
}

export const getCookieFromServer = (key, req) => {
    if(!req.headers.cookie) {
        return undefined
    }
    console.log('req.headers.cookie', req.headers.cookie);
    let token = req.headers.cookie.split(';').find(c => c.trim().startsWith(`${key}=`));
    if(!token) {
        return undefined
    }
    let tokenValue = token.split('=')[1]
    // console.log('getCookieFromServer', tokenValue);
    return tokenValue;
}

// Set in local storage
export const setLocalStorage = (key, value) => {
    if (process.browser) {
        localStorage.setItem(key, JSON.stringify(value))
    }
}

// Remove from local storage
export const removeLocalStorage = (key, value) => {
    if (process.browser) {
        localStorage.removeItem(key)
    }
}

// Authenticate user by passing data to cookie and localstorage during signin
export const authenticate = (response, next) => {
    setCookie('token', response.data.token);
    setLocalStorage('user', response.data.user);
    next();
}

// Access user info from localstorage isAuth()
export const isAuth = () => {
    if(process.browser) {
        const cookieChecked = getCookie('token');
        if(cookieChecked) {
            if(localStorage.getItem('user')) {
                return JSON.parse(localStorage.getItem('user'))
            } else {
                return false
            }
        }
    }
}

// Logout
export const logout = () => {
    removeCookie('token');
    removeLocalStorage('user');
    Router.push('/login');
}