import request from 'supertest';
import { createApp } from '../../src/app';
import { SuccessResponse, ErrorResponse } from '../../src/shared/response/ApiResponse';

const app = createApp();

describe('GET /api/health', () => {
  it('returns 200 with healthy status', async () => {
    const res = await request(app).get('/api/v1/health');
    const body = res.body as SuccessResponse<{ status: string; timestamp: string }>;

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.status).toBe('ok');
    expect(body.data.timestamp).toBeDefined();
    expect(body.message).toBe('Healthy');
  });

  it('returns 404 for unknown routes', async () => {
    const res = await request(app).get('/api/v1/unknown-route');
    const body = res.body as ErrorResponse;

    expect(res.status).toBe(404);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('NOT_FOUND');
  });
});
