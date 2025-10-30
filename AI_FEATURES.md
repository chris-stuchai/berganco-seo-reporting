# 🤖 AI-Powered SEO Insights

The BerganCo SEO Reporting system now includes AI-powered analysis that provides market-aware insights and strategic recommendations.

## Features

### 1. **AI-Enhanced Weekly Reports**
Weekly email reports now include:
- **Executive Summary**: AI-generated overview of performance
- **Market Context**: How current SEO trends relate to your data
- **Key Insights**: Data-driven observations with market awareness
- **Urgent Actions**: Prioritized immediate steps
- **Strategic Recommendations**: Long-term SEO strategies
- **Industry Trends**: Property management/real estate SEO context

### 2. **Real-Time Dashboard Insights**
The dashboard features an AI insights card that provides:
- Quick analysis of current performance
- Market-aware context
- Actionable recommendations
- Refresh button to get updated insights

## Setup

### Step 1: Get OpenAI API Key

1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Sign up or log in
3. Navigate to **API Keys** section
4. Click **"Create new secret key"**
5. Copy the API key (starts with `sk-`)

### Step 2: Add to Environment Variables

#### Local Development (.env file):
```bash
OPENAI_API_KEY=sk-your-api-key-here
```

#### Railway Deployment:
1. Go to your Railway project
2. Navigate to **Variables** tab
3. Add new variable:
   - **Key**: `OPENAI_API_KEY`
   - **Value**: Your OpenAI API key
4. Save and redeploy

## How It Works

### Weekly Reports
When a weekly report is generated:
1. System collects SEO metrics
2. Baseline insights are generated
3. **AI analyzes the data** considering:
   - Current Google algorithm updates
   - Property management industry trends
   - Competitive landscape
   - Technical SEO factors
   - Content opportunities
4. AI insights are **combined with baseline insights**
5. Enhanced report is sent via email

### Dashboard Insights
- Real-time AI analysis of current period data
- Considers market context and industry trends
- Refreshes when date filter changes
- Can be manually refreshed with "Refresh" button

## AI Analysis Capabilities

The AI considers:
- ✅ **Google Algorithm Updates**: Helpful Content Update, Core Updates, etc.
- ✅ **Industry Trends**: Property management/real estate SEO best practices
- ✅ **Competitive Opportunities**: Based on query performance analysis
- ✅ **Content Gaps**: Identification of optimization opportunities
- ✅ **Technical SEO**: Factors that may impact performance
- ✅ **Market Dynamics**: Current SEO landscape and trends

## Cost Considerations

The system uses **OpenAI's `gpt-4o-mini` model**, which is cost-effective:
- ~$0.15 per 1M input tokens
- ~$0.60 per 1M output tokens

**Estimated costs:**
- Weekly report: ~$0.01-0.02 per report
- Dashboard insights: ~$0.005 per refresh

**Monthly estimate**: ~$0.50-1.00 for weekly reports + dashboard usage

## Fallback Behavior

If OpenAI API key is not configured or API is unavailable:
- System uses **baseline insights** (rule-based analysis)
- Reports still generate successfully
- Dashboard shows fallback message
- No errors or failures - graceful degradation

## Troubleshooting

### AI Insights Not Showing

1. **Check API Key**: Ensure `OPENAI_API_KEY` is set correctly
2. **Verify API Access**: Test your API key at https://platform.openai.com/playground
3. **Check Logs**: Review Railway logs for API errors
4. **Rate Limits**: OpenAI has rate limits - wait and retry if needed

### High API Costs

1. Reduce dashboard refresh frequency
2. Consider caching insights (future enhancement)
3. Use fallback insights for testing

### API Errors

- Check OpenAI status: https://status.openai.com/
- Verify API key permissions
- Ensure account has credits/usage limits set

## Example Output

### Weekly Report AI Section:
```
🤖 AI ANALYSIS:

Executive Summary: [Brief overview of performance]

Market Context: [How current trends relate to data]

Key Insights:
• Insight 1
• Insight 2
• Insight 3

Industry Trends: [Relevant trends]

🤖 AI STRATEGIC RECOMMENDATIONS:

URGENT ACTIONS:
1. Action 1
2. Action 2

STRATEGIC RECOMMENDATIONS:
1. Recommendation 1
2. Recommendation 2
3. Recommendation 3
```

---

**Note**: AI features enhance but don't replace baseline analysis. The system works perfectly without AI, but AI adds valuable market context and strategic depth.
