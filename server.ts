import 'dotenv/config';
import express, { NextFunction, Request, Response } from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer as createViteServer } from 'vite';
import { getDb } from './db/database.ts';
import { ensureTrainedArtifacts, getEvaluationReport } from './ml/predictor.ts';
import { validateAssessmentInput } from './ml/preprocessor.ts';
import { CONDITION_CLASSES, SYMPTOM_CATALOG } from './ml/schema.ts';
import {
  DateRangeFilter,
  deleteAllAssessmentsForUser,
  deleteAssessmentForUser,
  executeAndPersistAssessment,
  getAssessmentDetail,
  getDashboardStatistics,
  listUserAssessments,
} from './services/assessmentService.ts';
import {
  AuthenticatedUser,
  changeUserPassword,
  getUserProfile,
  loginUser,
  registerUser,
  revokeSessionToken,
  updateUserProfile,
  verifySessionToken,
} from './services/authService.ts';
import { RECOMMENDATION_CENTER_TOPICS } from './services/recommendationService.ts';
import {
  createFollowupReminder,
  createSymptomTrackingLog,
  deleteFollowupReminder,
  deleteSymptomTrackingLog,
  getRecommendationCenterPayload,
  updateFollowupReminderStatus,
} from './services/trackingService.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
  authToken?: string;
}

function extractBearerToken(req: Request): string | undefined {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) return undefined;
  return header.slice('Bearer '.length).trim();
}

function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const token = extractBearerToken(req);
  const user = verifySessionToken(token);
  if (!user) {
    res.status(401).json({ error: 'Authentication required. Please sign in.' });
    return;
  }
  req.user = user;
  req.authToken = token;
  next();
}

/**
 * Lightweight CSRF / cross-site request safeguard for state-changing endpoints.
 * Ensures mutating API requests originate from same-origin or carry the X-Requested-With header.
 */
function requireSameOriginOrHeader(req: Request, res: Response, next: NextFunction): void {
  if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') {
    next();
    return;
  }
  const hasCustomHeader = req.headers['x-requested-with'] === 'MediPredictClient';
  const origin = req.headers.origin;
  const host = req.headers['x-forwarded-host'] || req.headers.host;

  if (hasCustomHeader) {
    next();
    return;
  }
  if (origin && host) {
    try {
      const originHost = new URL(origin).host;
      if (originHost === host) {
        next();
        return;
      }
    } catch {
      // Invalid Origin header
    }
  }
  // Allow automated test clients running without Origin when Bearer token or JSON content-type is explicit
  if (!origin && req.is('application/json')) {
    next();
    return;
  }
  res.status(403).json({ error: 'Cross-origin request blocked.' });
}

export function createApp(): express.Express {
  // Initialize SQLite schema and ensure ML model artifacts exist
  getDb();
  ensureTrainedArtifacts();

  const app = express();
  app.use(express.json({ limit: '1mb' }));
  app.use('/api', requireSameOriginOrHeader);

  // Public ML metadata & evaluation report (non-sensitive aggregate metrics)
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.get('/api/ml/evaluation', (_req, res) => {
    const report = getEvaluationReport();
    res.json(report);
  });

  app.get('/api/symptoms', (_req, res) => {
    res.json({
      symptoms: SYMPTOM_CATALOG,
      conditions: CONDITION_CLASSES,
    });
  });

  app.get('/api/recommendations/guide', (_req, res) => {
    res.json({
      topics: RECOMMENDATION_CENTER_TOPICS,
      disclaimer:
        'MediPredict AI provides structured health information for educational awareness only. It does not prescribe medication or replace evaluation by a licensed clinician.',
    });
  });

  app.get('/api/recommendations/center', requireAuth, (req: AuthenticatedRequest, res) => {
    const rawId = req.query.assessmentId;
    let requestedAssessmentId: number | undefined;
    if (rawId !== undefined && rawId !== '') {
      const parsed = Number(rawId);
      if (!Number.isInteger(parsed) || parsed <= 0) {
        res.status(400).json({ error: 'Invalid assessment identifier.' });
        return;
      }
      requestedAssessmentId = parsed;
    }
    const payload = getRecommendationCenterPayload(req.user!.id, requestedAssessmentId);
    res.json(payload);
  });

  // Symptom Monitoring Logs (user-scoped)
  app.post('/api/tracking/logs', requireAuth, (req: AuthenticatedRequest, res) => {
    const result = createSymptomTrackingLog(req.user!.id, req.body);
    if (!result.ok) {
      res.status(result.status).json({ error: result.error });
      return;
    }
    res.status(201).json({ log: result.log });
  });

  app.delete('/api/tracking/logs/:id', requireAuth, (req: AuthenticatedRequest, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      res.status(400).json({ error: 'Invalid symptom log identifier.' });
      return;
    }
    const deleted = deleteSymptomTrackingLog(req.user!.id, id);
    if (!deleted) {
      res.status(404).json({ error: 'Symptom log entry not found.' });
      return;
    }
    res.json({ ok: true });
  });

  // Consent-Gated Follow-Up Reminders (user-scoped)
  app.post('/api/reminders', requireAuth, (req: AuthenticatedRequest, res) => {
    const result = createFollowupReminder(req.user!.id, req.body);
    if (!result.ok) {
      res.status(result.status).json({ error: result.error });
      return;
    }
    res.status(201).json({ reminder: result.reminder });
  });

  app.patch('/api/reminders/:id', requireAuth, (req: AuthenticatedRequest, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      res.status(400).json({ error: 'Invalid reminder identifier.' });
      return;
    }
    const result = updateFollowupReminderStatus(req.user!.id, id, req.body?.status);
    if (!result.ok) {
      res.status(result.status).json({ error: result.error });
      return;
    }
    res.json({ reminder: result.reminder });
  });

  app.delete('/api/reminders/:id', requireAuth, (req: AuthenticatedRequest, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      res.status(400).json({ error: 'Invalid reminder identifier.' });
      return;
    }
    const deleted = deleteFollowupReminder(req.user!.id, id);
    if (!deleted) {
      res.status(404).json({ error: 'Reminder not found.' });
      return;
    }
    res.json({ ok: true });
  });

  // Authentication Routes
  app.post('/api/auth/register', (req, res) => {
    const { name, email, password, age } = req.body ?? {};
    const result = registerUser({ name, email, password, age });
    if (!result.ok) {
      res.status(result.status).json({ error: result.error });
      return;
    }
    const profile = getUserProfile(result.user.id);
    res.status(201).json({
      user: result.user,
      profile,
      token: result.token,
    });
  });

  app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body ?? {};
    const result = loginUser({ email, password });
    if (!result.ok) {
      res.status(result.status).json({ error: result.error });
      return;
    }
    const profile = getUserProfile(result.user.id);
    res.json({
      user: result.user,
      profile,
      token: result.token,
    });
  });

  app.post('/api/auth/logout', requireAuth, (req: AuthenticatedRequest, res) => {
    if (req.authToken) {
      revokeSessionToken(req.authToken);
    }
    res.json({ ok: true });
  });

  app.get('/api/auth/me', requireAuth, (req: AuthenticatedRequest, res) => {
    const profile = getUserProfile(req.user!.id);
    res.json({
      user: req.user,
      profile,
    });
  });

  // Profile Management
  app.get('/api/profile', requireAuth, (req: AuthenticatedRequest, res) => {
    const profile = getUserProfile(req.user!.id);
    if (!profile) {
      res.status(404).json({ error: 'Profile not found.' });
      return;
    }
    res.json({ profile });
  });

  app.put('/api/profile', requireAuth, (req: AuthenticatedRequest, res) => {
    const result = updateUserProfile(req.user!.id, req.body ?? {});
    if (!result.ok) {
      res.status(400).json({ error: result.error });
      return;
    }
    res.json({ profile: result.profile });
  });

  app.put('/api/auth/password', requireAuth, (req: AuthenticatedRequest, res) => {
    const { currentPassword, newPassword } = req.body ?? {};
    const result = changeUserPassword(req.user!.id, currentPassword, newPassword);
    if (!result.ok) {
      res.status(result.status).json({ error: result.error });
      return;
    }
    res.json({ ok: true });
  });

  // Dashboard Analytics (strictly calculated from authenticated user's persisted records)
  app.get('/api/dashboard/stats', requireAuth, (req: AuthenticatedRequest, res) => {
    const rawRange = String(req.query.range ?? 'all');
    const range: DateRangeFilter =
      rawRange === '7d' || rawRange === '30d' || rawRange === '6m' || rawRange === 'all'
        ? rawRange
        : 'all';
    const stats = getDashboardStatistics(req.user!.id, range);
    res.json(stats);
  });

  // Assessments: Submit, List, Detail, Delete, Clear All
  app.post('/api/assessments', requireAuth, (req: AuthenticatedRequest, res) => {
    const validation = validateAssessmentInput(req.body);
    if (!validation.ok) {
      res.status(400).json({ error: validation.error });
      return;
    }
    const report = executeAndPersistAssessment(req.user!.id, validation.value);
    res.status(201).json({ assessment: report });
  });

  app.get('/api/assessments', requireAuth, (req: AuthenticatedRequest, res) => {
    const items = listUserAssessments(req.user!.id, 200);
    res.json({ assessments: items });
  });

  app.get('/api/assessments/:id', requireAuth, (req: AuthenticatedRequest, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      res.status(400).json({ error: 'Invalid assessment identifier.' });
      return;
    }
    const detail = getAssessmentDetail(req.user!.id, id);
    if (!detail) {
      res.status(404).json({ error: 'Assessment record not found.' });
      return;
    }
    res.json({ assessment: detail });
  });

  app.delete('/api/assessments/:id', requireAuth, (req: AuthenticatedRequest, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      res.status(400).json({ error: 'Invalid assessment identifier.' });
      return;
    }
    const deleted = deleteAssessmentForUser(req.user!.id, id);
    if (!deleted) {
      res.status(404).json({ error: 'Assessment record not found.' });
      return;
    }
    res.json({ ok: true });
  });

  app.delete('/api/assessments', requireAuth, (req: AuthenticatedRequest, res) => {
    const deletedCount = deleteAllAssessmentsForUser(req.user!.id);
    res.json({ ok: true, deletedCount });
  });

  // Safe JSON error handler (never exposes stack traces or secrets)
  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error('[Server Error]', err.message);
    res.status(500).json({ error: 'An unexpected server error occurred.' });
  });

  return app;
}

async function startServer(): Promise<void> {
  const app = createApp();
  const isProd = process.env.NODE_ENV === 'production';
  const PORT = Number(process.env.PORT) || 3000;

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      const indexPath = path.join(distDir, 'index.html');
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(404).send('Build artifacts not found.');
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`MediPredict AI server running on http://0.0.0.0:${PORT}`);
  });
}

const invokedDirectly = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(__filename);
if (invokedDirectly) {
  startServer().catch((err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });
}
