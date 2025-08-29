import { useState } from 'react';
import { BookOpen, Clock, User, ArrowRight, Search, Brain, TrendingUp, Heart, Users, Utensils, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const Articles = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchTerm, setSearchTerm] = useState<string>("");

  const articles = [
    {
      id: 1,
      title: "Understanding Mild Cognitive Impairment: What You Need to Know",
      excerpt: "Learn about the early signs, diagnosis, and management strategies for MCI. This comprehensive guide covers everything from symptoms to treatment options.",
      author: "Dr. Sarah Johnson, Neurologist",
      readTime: "8 min read",
      category: "Education",
      featured: true,
    },
    {
      id: 2,
      title: "The Science Behind Brain Training: How Cognitive Games Help",
      excerpt: "Discover the research supporting cognitive training and how our AI-powered games are designed to maximize neuroplasticity and cognitive improvement.",
      author: "Dr. Michael Chen, Cognitive Scientist",
      readTime: "6 min read",
      category: "Research",
      featured: true,
    },
    {
      id: 3,
      title: "Nutrition for Brain Health: Foods That Boost Cognitive Function",
      excerpt: "Explore the connection between diet and brain health. Learn which foods support cognitive function and may help prevent cognitive decline.",
      author: "Emma Rodriguez, Nutritionist",
      readTime: "5 min read",
      category: "Lifestyle",
      featured: false,
    },
    {
      id: 4,
      title: "Exercise and Cognitive Health: The Mind-Body Connection",
      excerpt: "Understanding how physical exercise directly impacts brain health and cognitive performance. Includes practical exercise recommendations for seniors.",
      author: "Dr. James Thompson, Geriatrician",
      readTime: "7 min read",
      category: "Lifestyle",
      featured: false,
    },
    {
      id: 5,
      title: "Sleep and Memory: Why Quality Rest is Essential for Cognitive Health",
      excerpt: "Learn about the critical role of sleep in memory consolidation and cognitive function. Tips for improving sleep quality as you age.",
      author: "Dr. Lisa Park, Sleep Specialist",
      readTime: "6 min read",
      category: "Health",
      featured: false,
    },
    {
      id: 6,
      title: "Social Engagement and Cognitive Protection",
      excerpt: "Research shows that staying socially active can help protect against cognitive decline. Discover ways to maintain meaningful social connections.",
      author: "Dr. Robert Wilson, Psychologist",
      readTime: "5 min read",
      category: "Social",
      featured: false,
    },
    {
      id: 7,
      title: "Latest Breakthrough in Alzheimer's Research",
      excerpt: "Scientists discover new biomarkers that could lead to earlier detection and more effective treatments for Alzheimer's disease.",
      author: "Dr. Maria Garcia, Research Director",
      readTime: "9 min read",
      category: "Research",
      featured: false,
    },
    {
      id: 8,
      title: "Meditation and Mindfulness for Brain Health",
      excerpt: "How daily meditation practices can improve focus, reduce stress, and support long-term cognitive health.",
      author: "Dr. David Kim, Mindfulness Expert",
      readTime: "6 min read",
      category: "Lifestyle",
      featured: false,
    },
    {
      id: 9,
      title: "Managing Stress to Protect Your Brain",
      excerpt: "Understanding the impact of chronic stress on cognitive function and practical strategies for stress management.",
      author: "Dr. Jennifer Adams, Psychiatrist",
      readTime: "7 min read",
      category: "Health",
      featured: false,
    },
    {
      id: 10,
      title: "Building Brain-Healthy Habits for Life",
      excerpt: "Simple daily habits that can significantly impact your cognitive health and reduce the risk of dementia.",
      author: "Dr. Thomas Brown, Preventive Medicine",
      readTime: "8 min read",
      category: "Education",
      featured: false,
    },
  ];

  const categories = [
    { name: "All", icon: Brain, color: "primary" },
    { name: "Education", icon: BookOpen, color: "blue" },
    { name: "Research", icon: TrendingUp, color: "green" },
    { name: "Lifestyle", icon: Utensils, color: "orange" },
    { name: "Health", icon: Heart, color: "red" },
    { name: "Social", icon: Users, color: "purple" }
  ];

  const healthTips = [
    {
      title: "Daily Brain Exercises",
      description: "Spend 15-20 minutes daily on cognitive training games",
      icon: Brain,
    },
    {
      title: "Stay Socially Connected",
      description: "Regular social interaction supports cognitive health",
      icon: Users,
    },
    {
      title: "Quality Sleep",
      description: "7-9 hours of sleep helps consolidate memories",
      icon: Moon,
    },
    {
      title: "Nutritious Diet",
      description: "Mediterranean diet supports brain health",
      icon: Utensils,
    },
  ];

  // Filter articles based on category and search term
  const filteredArticles = articles.filter(article => {
    const matchesCategory = selectedCategory === "All" || article.category === selectedCategory;
    const matchesSearch = article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         article.excerpt.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         article.author.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const featuredArticles = filteredArticles.filter(article => article.featured);
  const regularArticles = filteredArticles;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="glass-card-strong p-8">
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Brain Health Hub
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Evidence-based insights, expert guidance, and practical strategies for optimal cognitive wellness
            </p>
          </div>
          
          {/* Search Bar */}
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search articles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-background/50 backdrop-blur-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            />
          </div>
          
          {/* Category Filters */}
          <div className="flex flex-wrap justify-center gap-3">
            {categories.map((category) => {
              const Icon = category.icon;
              return (
                <Button
                  key={category.name}
                  variant={selectedCategory === category.name ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category.name)}
                  className="rounded-full gap-2 transition-all hover:scale-105"
                >
                  <Icon className="h-3 w-3" />
                  {category.name}
                </Button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Quick Health Tips */}
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold text-foreground text-center">Daily Brain Health Tips</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {healthTips.map((tip, index) => {
            const Icon = tip.icon;
            return (
              <Card key={index} className="glass-card hover:shadow-lg transition-all duration-300 group">
                <CardContent className="p-6 text-center space-y-3">
                  <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground">{tip.title}</h3>
                  <p className="text-sm text-muted-foreground">{tip.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Articles Section */}
      <Tabs defaultValue="featured" className="space-y-6">
        <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
          <TabsTrigger value="featured" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            Featured
          </TabsTrigger>
          <TabsTrigger value="all" className="gap-2">
            <BookOpen className="h-4 w-4" />
            All Articles
          </TabsTrigger>
        </TabsList>

        <TabsContent value="featured" className="space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-foreground">Featured Articles</h2>
            <p className="text-muted-foreground">Hand-picked content by our experts</p>
          </div>
          
          {featuredArticles.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {featuredArticles.map((article) => (
                <Card key={article.id} className="glass-card hover:shadow-xl transition-all duration-300 group overflow-hidden">
                  <CardHeader className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full">
                        {article.category}
                      </span>
                      <span className="px-2 py-1 bg-gradient-to-r from-yellow-400/20 to-orange-400/20 text-yellow-600 dark:text-yellow-400 text-xs font-medium rounded-full">
                        Featured
                      </span>
                    </div>
                    
                    <CardTitle className="group-hover:text-primary transition-colors leading-tight">
                      {article.title}
                    </CardTitle>
                    
                    <CardDescription className="leading-relaxed">
                      {article.excerpt}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="pt-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <div className="flex items-center space-x-1">
                          <User className="h-3 w-3" />
                          <span>{article.author}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="h-3 w-3" />
                          <span>{article.readTime}</span>
                        </div>
                      </div>
                      
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-primary hover:text-primary-dark group-hover:translate-x-1 transition-all"
                        onClick={() => window.open(`/article/${article.id}`, '_blank')}
                      >
                        Read More
                        <ArrowRight className="h-3 w-3 ml-1" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No featured articles found matching your criteria.</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="all" className="space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-foreground">All Articles</h2>
            <p className="text-muted-foreground">
              {selectedCategory !== "All" 
                ? `${filteredArticles.length} articles in ${selectedCategory}` 
                : `${filteredArticles.length} articles available`}
            </p>
          </div>
          
          {regularArticles.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {regularArticles.map((article) => (
                <Card key={article.id} className="glass-card hover:shadow-lg transition-all duration-300 group">
                  <CardHeader className="space-y-3">
                    <span className="px-3 py-1 bg-secondary/10 text-secondary text-xs font-medium rounded-full w-fit">
                      {article.category}
                    </span>
                    
                    <CardTitle className="text-lg group-hover:text-primary transition-colors leading-tight">
                      {article.title}
                    </CardTitle>
                    
                    <CardDescription className="text-sm leading-relaxed">
                      {article.excerpt}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="pt-0">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                          <User className="h-3 w-3" />
                          <span>{article.author}</span>
                        </div>
                        <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>{article.readTime}</span>
                        </div>
                      </div>
                      
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-primary hover:text-primary-dark"
                        onClick={() => window.open(`/article/${article.id}`, '_blank')}
                      >
                        <BookOpen className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No articles found matching your search criteria.</p>
              <Button 
                variant="outline" 
                onClick={() => {
                  setSelectedCategory("All");
                  setSearchTerm("");
                }}
                className="mt-4"
              >
                Clear Filters
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Newsletter & Resources */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Newsletter Signup */}
        <Card className="glass-card">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              Weekly Brain Health Newsletter
            </CardTitle>
            <CardDescription>
              Get evidence-based tips, latest research, and expert insights delivered weekly
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex space-x-2">
              <input
                type="email"
                placeholder="Enter your email address"
                className="flex-1 px-4 py-3 rounded-xl border border-border bg-background/50 backdrop-blur-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
              <Button className="btn-primary px-6">
                Subscribe
              </Button>
            </div>
            <p className="text-xs text-muted-foreground text-center">
              Join 50,000+ readers. Unsubscribe anytime.
            </p>
          </CardContent>
        </Card>

        {/* Quick Resources */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Quick Resources
            </CardTitle>
            <CardDescription>
              Essential tools and assessments for brain health
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full justify-start gap-2">
              <Brain className="h-4 w-4" />
              Cognitive Assessment Tool
            </Button>
            <Button variant="outline" className="w-full justify-start gap-2">
              <Heart className="h-4 w-4" />
              Brain Health Checklist
            </Button>
            <Button variant="outline" className="w-full justify-start gap-2">
              <BookOpen className="h-4 w-4" />
              Research Database
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Articles;