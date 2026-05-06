'use client';

'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  BookOpen, 
  Calculator, 
  TrendingUp, 
  Lightbulb, 
  Target, 
  Award, 
  GraduationCap,
  DollarSign,
  PiggyBank,
  Shield,
  Zap,
  Users,
  Clock,
  Search,
  FileText,
  Video,
  Download,
  ChevronRight
} from 'lucide-react';
import { TutorialViewer } from '@/components/learn/TutorialViewer';
import { CalculatorWidget } from '@/components/learn/CalculatorWidget';
import { calculators } from '@/lib/calculators';

export default function LearnPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showTutorial, setShowTutorial] = useState(false);
  const [selectedTutorial, setSelectedTutorial] = useState<any>(null);
  const [showCalculator, setShowCalculator] = useState(false);
  const [selectedCalculator, setSelectedCalculator] = useState<any>(null);

  const categories = [
    { id: 'basics', name: 'Financial Basics', icon: BookOpen, color: 'bg-blue-100 text-blue-700' },
    { id: 'budgeting', name: 'Budgeting', icon: Target, color: 'bg-green-100 text-green-700' },
    { id: 'investing', name: 'Investing', icon: TrendingUp, color: 'bg-purple-100 text-purple-700' },
    { id: 'saving', name: 'Saving', icon: PiggyBank, color: 'bg-yellow-100 text-yellow-700' },
    { id: 'debt', name: 'Debt Management', icon: Shield, color: 'bg-red-100 text-red-700' },
    { id: 'planning', name: 'Financial Planning', icon: Award, color: 'bg-indigo-100 text-indigo-700' }
  ];

  const tutorials = [
    {
      id: 'budget-101',
      title: 'Budgeting 101',
      category: 'basics',
      difficulty: 'Beginner',
      duration: '15 min',
      description: 'Learn the fundamentals of creating and maintaining a personal budget',
      icon: BookOpen,
      tags: ['budgeting', 'basics'],
      content: 'A budget is your financial roadmap. It helps you allocate your income toward different goals and track your progress.',
      steps: [
        {
          title: 'Understanding Your Income',
          content: 'Start by calculating your total monthly take-home pay after taxes. Include all sources: salary, freelance work, side hustles, etc.',
          action: 'List all your income sources and calculate the total amount.'
        },
        {
          title: 'Tracking Your Expenses',
          content: 'For one month, track every expense, no matter how small. Use categories like housing, food, transportation, entertainment, etc.',
          action: 'Use a notebook or app to categorize every expense for 30 days.'
        },
        {
          title: 'Creating Your Budget',
          content: 'Subtract your total expenses from your income. The remaining amount is what you can allocate toward savings and debt repayment.',
          action: 'Create a simple budget: Income - Fixed Expenses - Variable Expenses = Available for Goals.'
        }
      ]
    },
    {
      id: 'expense-tracking',
      title: 'Effective Expense Tracking',
      category: 'basics',
      difficulty: 'Beginner',
      duration: '20 min',
      description: 'Master the art of tracking expenses and understanding your spending patterns',
      icon: FileText,
      tags: ['tracking', 'expenses'],
      content: 'Consistent expense tracking is the foundation of financial awareness. It reveals where your money actually goes.',
      steps: [
        {
          title: 'Choose Your Method',
          content: 'Select between digital apps, spreadsheets, or the envelope method. Find what works for your lifestyle.',
          action: 'Research and choose one expense tracking method to try for the next month.'
        },
        {
          title: 'Categorize Everything',
          content: 'Create meaningful categories that reflect your lifestyle. Common categories include housing, food, transportation, utilities, etc.',
          action: 'Create 5-10 categories that cover all your spending areas.'
        },
        {
          title: 'Review and Adjust',
          content: 'At month end, review your spending patterns. Look for areas where you can cut back without impacting your quality of life.',
          action: 'Analyze your spending patterns and identify 2-3 areas for potential reduction.'
        }
      ]
    },
    {
      id: '50-30-20-rule',
      title: 'The 50/30/20 Rule',
      category: 'budgeting',
      difficulty: 'Intermediate',
      duration: '10 min',
      description: 'Learn this popular budgeting framework for financial allocation',
      icon: Target,
      tags: ['budgeting', 'rules'],
      content: 'The 50/30/20 rule provides a simple framework for allocating your after-tax income.',
      steps: [
        {
          title: '50% for Needs',
          content: 'Allocate 50% of your income to essential needs: housing, utilities, groceries, transportation, insurance, and minimum debt payments.',
          action: 'Calculate your monthly needs and ensure they don\'t exceed 50% of your income.'
        },
        {
          title: '30% for Wants',
          content: 'Allocate 30% for lifestyle wants: dining out, entertainment, shopping, hobbies, and travel.',
          action: 'List your wants and prioritize them based on importance and enjoyment.'
        },
        {
          title: '20% for Savings',
          content: 'Allocate 20% for savings and debt repayment. This builds your emergency fund and future goals.',
          action: 'Automate your 20% savings to transfer on payday before you can spend it.'
        }
      ]
    },
    {
      id: 'investment-basics',
      title: 'Investment Fundamentals',
      category: 'investing',
      difficulty: 'Intermediate',
      duration: '25 min',
      description: 'Understand different investment types and basic portfolio strategies',
      icon: TrendingUp,
      tags: ['investing', 'basics'],
      content: 'Investing is how you make your money work for you. Understanding the basics is crucial for long-term financial success.',
      steps: [
        {
          title: 'Risk and Return',
          content: 'Higher potential returns typically come with higher risk. Understand your risk tolerance before investing.',
          action: 'Assess your comfort level with market fluctuations and potential losses.'
        },
        {
          title: 'Diversification',
          content: 'Don\'t put all your eggs in one basket. Spread investments across different asset classes and sectors.',
          action: 'Research 3-5 different investment types (stocks, bonds, real estate, etc.).'
        },
        {
          title: 'Time Horizon',
          content: 'Longer time horizons allow for more aggressive investments. Shorter horizons require conservative approaches.',
          action: 'Define your investment goals: retirement (10+ years), medium-term (3-10 years), short-term (under 3 years).'
        }
      ]
    },
    {
      id: 'emergency-fund',
      title: 'Building Your Emergency Fund',
      category: 'saving',
      difficulty: 'Beginner',
      duration: '15 min',
      description: 'Learn why and how to build a financial safety net',
      icon: Shield,
      tags: ['saving', 'emergency'],
      content: 'An emergency fund is your financial safety net. It prevents debt during unexpected life events.',
      steps: [
        {
          title: 'Calculate Your Target',
          content: 'Aim for 3-6 months of essential expenses. This covers job loss, medical emergencies, or unexpected repairs.',
          action: 'Calculate your monthly essential expenses and multiply by 3-6 to determine your target amount.'
        },
        {
          title: 'Start Small',
          content: 'Begin with $500-$1,000 if possible. Small wins build momentum and make the goal feel achievable.',
          action: 'Open a separate high-yield savings account specifically for your emergency fund.'
        },
        {
          title: 'Automate Contributions',
          content: 'Set up automatic transfers from checking to savings right after payday. Pay yourself first.',
          action: 'Set up automatic monthly transfers to your emergency fund account.'
        }
      ]
    }
  ];

  const calculatorsList: any[] = calculators;

  const tips = [
    {
      id: 'automate-savings',
      title: 'Automate Your Savings',
      category: 'saving',
      tip: 'Set up automatic transfers to your savings account right after payday. Even small amounts add up over time.',
      icon: Zap
    },
    {
      id: 'track-expenses',
      title: 'Track Every Expense',
      category: 'basics',
      tip: 'No expense is too small to track. Small purchases like coffee or snacks can add up to hundreds per month.',
      icon: FileText
    },
    {
      id: '50-30-20-rule-practical',
      title: 'Practical 50/30/20 Application',
      category: 'budgeting',
      tip: 'Start with 50% for needs, 30% for wants, and 20% for savings. Adjust based on your actual situation.',
      icon: Target
    },
    {
      id: 'emergency-fund-first',
      title: 'Emergency Fund First',
      category: 'saving',
      tip: 'Before investing aggressively, build 3-6 months of expenses in an emergency fund. This prevents debt during emergencies.',
      icon: Shield
    },
    {
      id: 'review-subscriptions',
      title: 'Review Subscriptions Monthly',
      category: 'basics',
      tip: 'Audit all monthly subscriptions. Many people pay for services they rarely use. Cancel what you don\'t need.',
      icon: Clock
    }
  ];

  const glossary = [
    { term: 'Budget', definition: 'A plan for how to spend and save money based on income and expenses.' },
    { term: 'Emergency Fund', definition: 'Money set aside for unexpected expenses or financial emergencies.' },
    { term: 'Net Worth', definition: 'Total assets minus total liabilities; your overall financial position.' },
    { term: 'Compound Interest', definition: 'Interest calculated on the initial principal and accumulated interest.' },
    { term: 'Diversification', definition: 'Spreading investments across various assets to reduce risk.' },
    { term: 'Credit Score', definition: 'A number representing creditworthiness based on credit history.' },
    { term: '401(k)', definition: 'Employer-sponsored retirement savings plan in the United States.' },
    { term: 'ROI', definition: 'Return on Investment; measure of investment profitability.' },
    { term: 'APR', definition: 'Annual Percentage Rate; the yearly cost of borrowing money.' }
  ];

  const filteredTutorials = tutorials.filter(tutorial => 
    selectedCategory === 'all' || tutorial.category === selectedCategory
  );

  const filteredCalculators = calculatorsList.filter((calculator: any) => 
    selectedCategory === 'all' || calculator.category === selectedCategory
  );

  const filteredTips = tips.filter((tip: any) => 
    selectedCategory === 'all' || tip.category === selectedCategory
  );

  const handleTutorialClick = (tutorial: any) => {
    setSelectedTutorial(tutorial);
    setShowTutorial(true);
  };

  const handleCalculatorClick = (calculator: any) => {
    setSelectedCalculator(calculator);
    setShowCalculator(true);
  };

  const handleCloseTutorial = () => {
    setShowTutorial(false);
    setSelectedTutorial(null);
  };

  const handleCloseCalculator = () => {
    setShowCalculator(false);
    setSelectedCalculator(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <div>
          <h1 className="text-3xl font-bold">Financial Education Hub</h1>
          <p className="text-muted-foreground text-lg">
            Learn essential financial skills with tutorials, calculators, and expert tips
          </p>
        </div>
        
        {/* Search */}
        <div className="max-w-md mx-auto">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tutorials, calculators, or tips..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap justify-center gap-2">
        <Button
          variant={selectedCategory === 'all' ? 'default' : 'outline'}
          onClick={() => setSelectedCategory('all')}
          size="sm"
        >
          All Topics
        </Button>
        {categories.map((category) => (
          <Button
            key={category.id}
            variant={selectedCategory === category.id ? 'default' : 'outline'}
            onClick={() => setSelectedCategory(category.id)}
            size="sm"
            className="flex items-center gap-2"
          >
            <category.icon className="h-4 w-4" />
            {category.name}
          </Button>
        ))}
      </div>

      <Tabs defaultValue="tutorials" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="tutorials" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Tutorials
          </TabsTrigger>
          <TabsTrigger value="calculators" className="flex items-center gap-2">
            <Calculator className="h-4 w-4" />
            Calculators
          </TabsTrigger>
          <TabsTrigger value="tips" className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4" />
            Tips
          </TabsTrigger>
          <TabsTrigger value="glossary" className="flex items-center gap-2">
            <Award className="h-4 w-4" />
            Glossary
          </TabsTrigger>
        </TabsList>

        {/* Tutorials Tab */}
        <TabsContent value="tutorials" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredTutorials.map((tutorial) => (
              <Card key={tutorial.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <CardTitle className="text-lg">{tutorial.title}</CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {tutorial.category}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {tutorial.difficulty}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {tutorial.duration}
                        </Badge>
                      </div>
                      <div className="flex gap-1">
                        {tutorial.tags.map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="p-2 bg-muted/50 rounded-lg">
                      <tutorial.icon className="h-8 w-8 text-muted-foreground" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {tutorial.description}
                  </p>
                  <div className="mt-4 pt-4 border-t">
                    <Button className="w-full" onClick={() => handleTutorialClick(tutorial)}>
                      <BookOpen className="mr-2 h-4 w-4" />
                      Start Tutorial
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Calculators Tab */}
        <TabsContent value="calculators" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredCalculators.map((calculator) => (
              <Card key={calculator.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <CardTitle className="text-lg">{calculator.title}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {calculator.description}
                      </p>
                    </div>
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <calculator.icon className="h-8 w-8 text-muted-foreground" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="mt-4 pt-4 border-t">
                    <Button className="w-full" onClick={() => handleCalculatorClick(calculator)}>
                      <Calculator className="mr-2 h-4 w-4" />
                      Open Calculator
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Tips Tab */}
        <TabsContent value="tips" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
            {filteredTips.map((tip, index) => (
              <Card key={tip.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-muted/50 rounded-lg">
                      <tip.icon className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{tip.title}</CardTitle>
                      <Badge variant="outline" className="text-xs">
                        {tip.category}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {tip.tip}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Glossary Tab */}
        <TabsContent value="glossary" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Financial Glossary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {glossary.map((item, index) => (
                  <div key={index} className="border-b pb-4 last:border-b-0">
                    <div className="flex items-start gap-3">
                      <div className="font-semibold text-lg min-w-32">
                        {item.term}
                      </div>
                      <div className="text-muted-foreground">
                        {item.definition}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Quick Stats */}
      <div className="mt-8 pt-6 border-t">
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-4">Continue Your Learning Journey</h3>
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="text-center">
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-blue-600">5+</div>
                <div className="text-sm text-muted-foreground">Tutorials Available</div>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-green-600">6</div>
                <div className="text-sm text-muted-foreground">Calculators</div>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-purple-600">10+</div>
                <div className="text-sm text-muted-foreground">Expert Tips</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>

      {/* Tutorial Modal */}
      {showTutorial && selectedTutorial && (
        <TutorialViewer
          tutorial={selectedTutorial}
          onClose={handleCloseTutorial}
          onComplete={() => {
            // Mark tutorial as completed
            console.log(`Tutorial completed: ${selectedTutorial.title}`);
            handleCloseTutorial();
          }}
        />
      )}

      {/* Calculator Modal */}
      {showCalculator && selectedCalculator && (
        <CalculatorWidget
          calculator={selectedCalculator}
          onClose={handleCloseCalculator}
        />
      )}
    </div>
  );
}
