// src/pages/Home.tsx
import React from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowRight, Clipboard, LineChart, Users } from 'lucide-react'

const Home: React.FC = () => {
  return (
    <div className="py-10">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
          Create Customer Surveys in Minutes
        </h1>
        <p className="mt-6 text-xl text-gray-500">
          Build custom survey portals, collect valuable feedback, and gain insights from your customers
        </p>
        <div className="mt-10 flex justify-center">
          <Link to="/company">
            <Button size="lg" className="mr-4">
              Get Started <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>

      <div className="mt-20">
        <h2 className="text-2xl font-bold text-center">How It Works</h2>
        <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="mx-auto bg-primary/10 p-3 rounded-full w-12 h-12 flex items-center justify-center">
                  <Clipboard className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mt-4 text-lg font-medium">Create Your Surveys</h3>
                <p className="mt-2 text-sm text-gray-500">
                  Design custom surveys with multiple question types to gather the feedback you need
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="mx-auto bg-primary/10 p-3 rounded-full w-12 h-12 flex items-center justify-center">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mt-4 text-lg font-medium">Share With Customers</h3>
                <p className="mt-2 text-sm text-gray-500">
                  Share your survey portal with customers via email, social media, or embed on your website
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="mx-auto bg-primary/10 p-3 rounded-full w-12 h-12 flex items-center justify-center">
                  <LineChart className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mt-4 text-lg font-medium">Analyze Results</h3>
                <p className="mt-2 text-sm text-gray-500">
                  View analytics and download reports to gain insights from your customer feedback
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default Home