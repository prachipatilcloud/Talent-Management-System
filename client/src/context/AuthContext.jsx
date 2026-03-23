import { useEffect } from "react";
import { useState } from "react";
import { createContext } from "react";
import API from "../api/axios";
import { useContext } from "react";


const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const restoreSession = async() =>{
            console.log('AuthContext: Attempting to restore session...');
            try {

                const res = await API.get('/auth/me');
                console.log('AuthContext: Session restored, user:', res.data.user);
                setUser(res.data.user);
                
            } catch (error) {
                console.log('AuthContext: Session restore failed:', error.response?.status, error.message);
                setUser(null);
            } finally{
                setLoading(false);
            }
        };
        restoreSession();
    }, []);

    const login = async(email, password) => {
        const res = await API.post('/auth/login', { email, password });
        localStorage.setItem('accessToken', res.data.accessToken)
        setUser(res.data.user)
        return res.data;
    }
    const register = async(data) => {
        const res = await API.post('/auth/register', data);
        localStorage.setItem('accessToken', res.data.accessToken)
        setUser(res.data.user)
        return res.data;
    }
    const logout = async() => {
        await API.post('/auth/logout');
        localStorage.removeItem('accessToken')
        setUser(null)
    }

    return (
        <AuthContext.Provider 
            value={{
                user, loading, login, logout, register
            }}>
            {children}
        </AuthContext.Provider>
    )   
}

export const useAuth = () => useContext(AuthContext);