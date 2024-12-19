import { NextResponse } from 'next/server';

export const Ok = <T>(body?: T, init?: ResponseInit): NextResponse => {
  return NextResponse.json(body, {
    ...init,
    status: 200,
  });
};

export const BadRequest = (message: string): NextResponse => {
  return NextResponse.json(
    { message },
    {
      status: 400,
    },
  );
};

export const InternalServerError = <T>(error?: T): NextResponse => {
  return NextResponse.json(
    { error },
    {
      status: 500,
    },
  );
};
