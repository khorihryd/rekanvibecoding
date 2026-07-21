import { NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Throw an intentional test error to trigger Sentry logging
    throw new Error('CSA Sentry Test Exception: Verification successful!');
  } catch (error) {
    // Capture the exception using Sentry SDK
    const eventId = Sentry.captureException(error);

    return NextResponse.json({
      status: 'error_captured',
      message: 'Intentional error thrown and captured by Sentry.',
      eventId,
      note: 'Check your Sentry dashboard to verify receipt of this event ID.'
    });
  }
}
