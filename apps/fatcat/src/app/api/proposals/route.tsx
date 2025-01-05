import { NextResponse } from 'next/server';
import axios from 'axios';
import https from 'https';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Create custom axios instance with SSL verification disabled in development
const instance = axios.create({
    httpsAgent: new https.Agent({
        rejectUnauthorized: false // This was working locally
    })
});

export async function GET(request: Request) {
    const start = Date.now();
    console.log('[API] Starting proposals request');

    try {
        const { searchParams } = new URL(request.url);
        const limit = searchParams.get('limit') ?? '10';

        const apiUrl = `https://api.glam.systems/v0/governance/proposals/jupiter?limit=${limit}`;
        console.log('[API] Fetching from:', apiUrl);

        const response = await instance.get(apiUrl, {
            headers: {
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0',
                'Accept': '*/*',
                'Accept-Encoding': 'gzip, deflate, br',
                'User-Agent': 'PostmanRuntime/7.42.0'
            }
        });

        console.log('[API] Request completed successfully', {
            duration: Date.now() - start,
            dataLength: Array.isArray(response.data) ? response.data.length : 'not an array'
        });

        return NextResponse.json(response.data, {
            headers: {
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            }
        });

    } catch (error) {
        if (axios.isAxiosError(error)) {
            console.error('[API] Axios error:', {
                message: error.message,
                status: error.response?.status,
                data: error.response?.data,
                duration: Date.now() - start,
                code: error.code,
                cause: error.cause
            });

            return NextResponse.json(
                {
                    message: 'External API error',
                    details: error.message,
                    status: error.response?.status,
                    data: error.response?.data
                },
                {
                    status: error.response?.status || 500,
                    headers: {
                        'Cache-Control': 'no-cache, no-store, must-revalidate',
                        'Pragma': 'no-cache',
                        'Expires': '0'
                    }
                }
            );
        }

        console.error('[API] Unexpected error:', {
            message: error instanceof Error ? error.message : 'Unknown error occurred',
            stack: error instanceof Error ? error.stack : undefined,
            duration: Date.now() - start
        });

        return NextResponse.json(
            {
                message: 'Internal server error',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            {
                status: 500,
                headers: {
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache',
                    'Expires': '0'
                }
            }
        );
    }
}