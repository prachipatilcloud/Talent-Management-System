import { useAuth } from "../context/AuthContext";
import { Navigate } from "react-router-dom";
import { Box, CircularProgress } from "@mui/material";

const ProtectedRoute = ({ children, roles }) => {
    const { user, loading } = useAuth();

    if(loading){
        return(
            <Box display='flex' justifyContent = 'center' alignItems='center' minHeight = '100vh'>
                <CircularProgress />
            </Box>
        )
    }

    if(!user) return <Navigate to="/login" replace />;

    if(roles && !roles.includes(user.role)){
        return <Navigate to='/unauthorized' replace />;
    }

    return children;
}

export default ProtectedRoute;