import { BookOpen, Clock, User, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Articles = () => {
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
  ];

  const categories = ["All", "Education", "Research", "Lifestyle", "Health", "Social"];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="glass-card-strong p-8">
        <div className="space-y-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Brain Health Articles</h1>
            <p className="text-lg text-muted-foreground">
              Expert insights and research-backed information for cognitive wellness
            </p>
          </div>
          
          {/* Category Filters */}
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <Button
                key={category}
                variant={category === "All" ? "default" : "outline"}
                size="sm"
                className="rounded-full"
              >
                {category}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Featured Articles */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-foreground">Featured Articles</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {articles.filter(article => article.featured).map((article) => (
            <div key={article.id} className="glass-card p-6 space-y-4 hover:shadow-lg transition-all duration-300 group">
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full">
                    {article.category}
                  </span>
                  <span className="text-xs text-muted-foreground">Featured</span>
                </div>
                
                <h3 className="text-xl font-semibold text-foreground group-hover:text-primary transition-colors leading-tight">
                  {article.title}
                </h3>
                
                <p className="text-muted-foreground leading-relaxed">
                  {article.excerpt}
                </p>
              </div>
              
              <div className="flex items-center justify-between pt-4 border-t border-border">
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
                
                <Button variant="ghost" size="sm" className="text-primary hover:text-primary-dark">
                  Read More
                  <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* All Articles */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-foreground">All Articles</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {articles.filter(article => !article.featured).map((article) => (
            <div key={article.id} className="glass-card p-6 space-y-4 hover:shadow-lg transition-all duration-300 group">
              <div className="space-y-3">
                <span className="px-2 py-1 bg-secondary/10 text-secondary text-xs font-medium rounded-full">
                  {article.category}
                </span>
                
                <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors leading-tight">
                  {article.title}
                </h3>
                
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {article.excerpt}
                </p>
              </div>
              
              <div className="flex items-center justify-between pt-4 border-t border-border">
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
                
                <Button variant="ghost" size="sm" className="text-primary hover:text-primary-dark">
                  <BookOpen className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Newsletter Signup */}
      <div className="glass-card p-8 text-center">
        <div className="max-w-md mx-auto space-y-4">
          <h3 className="text-xl font-semibold text-foreground">Stay Updated</h3>
          <p className="text-muted-foreground">
            Get the latest brain health insights and research delivered to your inbox weekly.
          </p>
          <div className="flex space-x-2">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-4 py-2 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <Button className="btn-primary">
              Subscribe
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Articles;