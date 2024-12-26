import type { ReactNode } from 'react';

import 'fumadocs-ui/style.css';
import { RootProvider } from 'fumadocs-ui/provider';
import { Inter } from 'next/font/google';

const inter = Inter({
	subsets: ['latin'],
});

export default function Layout({ children }: { children: ReactNode }) {
	return (
		<html className={inter.className} lang="en" suppressHydrationWarning>
			<body style={{
				display: 'flex',
				flexDirection: 'column',
				minHeight: '100vh',
			}}
			>
				<RootProvider>{children}</RootProvider>
			</body>
		</html>
	);
}
