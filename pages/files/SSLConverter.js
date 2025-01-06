import Link from 'next/link';
import { useState } from 'react';
import Head from 'next/head';
import styles from '/styles/Home.module.css';

export default function SSLConverter() {
  return (
    <>
    <Head>
        <title>SSL Converter</title>
    </Head>
      <h1>SSL Converter</h1>
      <h2>
        <Link href="/">Back to home</Link>
      </h2>
    </>
  );
}