import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';

//Import routes
import userRoute from './routes/userRoutes.js';
import authRoute from './routes/authRoute.js';
import candidateRoute from './routes/candidateRoute.js';
import googleDriveRoute from './routes/googleDriveRoute.js';
import interviewerRoute from './routes/interviewerRoute.js';
import notificationRoute from './routes/notificationRoute.js';

const app = express();

//middlewares
app.use(helmet());
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));    

app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use('/api/auth', authRoute)
app.use('/api/users', userRoute);
app.use('/api/candidates', candidateRoute);
app.use('/api/gdrive', googleDriveRoute);
app.use('/api/interviewer', interviewerRoute);
app.use('/api/notifications', notificationRoute);

export default app;