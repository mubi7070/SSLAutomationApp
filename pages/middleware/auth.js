// middleware/auth.js
import { getCookie } from 'cookies-next';

export async function middleware(req, res) {
  const sessionToken = getCookie('sessionToken', { req, res });

  if (!sessionToken) {
    return {
      redirect: {
        destination: '/',
        permanent: false,
      },
    };
  }

  try {
    const response = await fetch(`${process.env.BASE_URL}/api/validate-session`, {
      headers: {
        Cookie: `sessionToken=${sessionToken}`,
      },
    });
    
    if (!response.ok) throw new Error('Invalid session');
    
    return { props: {} };
  } catch (error) {
    return {
      redirect: {
        destination: '/',
        permanent: false,
      },
    };
  }
}