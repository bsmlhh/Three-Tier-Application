import compression from 'compression';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import { FRONTEND_URL, NODE_ENV } from './config/utils.js';
import authRouter from './routes/auth.js';
import postsRouter from './routes/posts.js';
import userRouter from './routes/user.js';
import errorMiddleware from './middlewares/error-middleware.js';

const app = express();

// FRONTEND_URL may be a single origin or a comma-separated allowlist.
const allowedOrigins = (FRONTEND_URL || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

app.use(cors({
    origin(origin, callback) {
        // Allow non-browser clients (curl, server-to-server) that send no Origin.
        if (!origin) return callback(null, true);
        // In development, reflect any origin so the app works whether it's
        // reached via localhost, a LAN IP, or a Tailscale address.
        if (NODE_ENV !== 'production') return callback(null, true);
        if (allowedOrigins.includes(origin)) return callback(null, true);
        return callback(new Error(`Not allowed by CORS: ${origin}`));
    },
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(compression());


// API route
app.use('/api/posts', postsRouter);
app.use('/api/auth', authRouter);
app.use('/api/user', userRouter);

app.get('/', (req, res) => {
    res.send('Yay!! Backend of wanderlust app is now accessible');
});

app.all("*", (req, res) => {
    res.status(404).json({
        status: 404,
        success: false,
        message: "!Oops page not found"
    })
})

app.use(errorMiddleware)
export default app;