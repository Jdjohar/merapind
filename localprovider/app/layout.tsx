// app/layout.tsx
import './globals.css';
import { ReactNode } from 'react';
import Navbar from '../components/Navbar';

export const metadata = {
  title: 'Mera Pind',
  description: 'Find trusted local service providers and chat with pros.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white flex flex-col">
        <Navbar />
        <main className="flex-grow">
          {children}
        </main>

        <footer className="bg-gray-900 text-white py-12 border-t border-gray-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div>
                <span className="text-2xl font-bold mb-4 block">Mera Pind</span>
                <p className="text-gray-400 text-sm">Connecting you with the best local professionals for all your home service needs.</p>
              </div>
              <div>
                <h4 className="font-semibold mb-4">Services</h4>
                <ul className="space-y-2 text-gray-400 text-sm">
                  <li><a href="#" className="hover:text-white">Plumbing</a></li>
                  <li><a href="#" className="hover:text-white">Electrical</a></li>
                  <li><a href="#" className="hover:text-white">Cleaning</a></li>
                  <li><a href="#" className="hover:text-white">Carpentry</a></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-4">Support</h4>
                <ul className="space-y-2 text-gray-400 text-sm">
                  <li><a href="#" className="hover:text-white">Help Center</a></li>
                  <li><a href="#" className="hover:text-white">Terms of Service</a></li>
                  <li><a href="#" className="hover:text-white">Privacy Policy</a></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-4">For Providers</h4>
                <ul className="space-y-2 text-gray-400 text-sm">
                  <li><a href="#" className="hover:text-white">Become a Pro</a></li>
                  <li><a href="#" className="hover:text-white">Success Stories</a></li>
                </ul>
              </div>
            </div>
            <div className="mt-12 pt-8 border-t border-gray-800 text-center text-gray-500 text-sm">
              &copy; {new Date().getFullYear()} Mera Pind. All rights reserved.
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
