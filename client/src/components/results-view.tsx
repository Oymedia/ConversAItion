import { useLocation } from "wouter";
import type { Conversation, Scenario, ConversationOutcome } from "@shared/schema";
import { Button } from "@/components/ui/button";

interface ResultsViewProps {
  conversation: Conversation;
  scenario: Scenario;
  outcome: ConversationOutcome;
}

export default function ResultsView({ conversation, scenario, outcome }: ResultsViewProps) {
  const [, setLocation] = useLocation();

  const handleStartNew = () => {
    setLocation('/');
  };

  const handleExport = () => {
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
    script.onload = () => {
      const { jsPDF } = (window as any).jspdf;
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      const maxWidth = pageWidth - margin * 2;
      let y = margin;

      const addLine = (text, size, bold = false, color = [26,26,26], bgColor = null) => {
        if (y > pageHeight - 20) { doc.addPage(); y = margin; }
        doc.setFontSize(size);
        doc.setFont("helvetica", bold ? "bold" : "normal");
        doc.setTextColor(...color);
        const lines = doc.splitTextToSize(text, maxWidth);
        if (bgColor) {
          doc.setFillColor(...bgColor);
          doc.roundedRect(margin - 4, y - size * 0.35, maxWidth + 8, lines.length * size * 0.5 + 6, 3, 3, "F");
        }
        lines.forEach((line) => {
          if (y > pageHeight - 20) { doc.addPage(); y = margin; }
          doc.text(line, margin, y);
          y += size * 0.5;
        });
        y += 3;
      };

      const addDivider = () => {
        doc.setDrawColor(232, 54, 93);
        doc.setLineWidth(0.5);
        doc.line(margin, y, pageWidth - margin, y);
        y += 8;
      };

      const addSection = (title) => {
        y += 4;
        doc.setFillColor(255, 240, 244);
        doc.roundedRect(margin - 4, y - 6, maxWidth + 8, 12, 2, 2, "F");
        doc.setFontSize(13);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(232, 54, 93);
        doc.text(title, margin, y + 2);
        y += 12;
      };

      // Header
      doc.setFillColor(232, 54, 93);
      doc.rect(0, 0, pageWidth, 30, "F");
      doc.addImage("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAASwAAAA3CAYAAAC2G3eZAAAABmJLR0QA/wD/AP+gvaeTAAAQB0lEQVR4nO2de5RWVRXAfwwwKg9DI00USlAREdNKzaTIN2ppD62VlvRwVfR+iJQ9/FY5zIIUUibF6AFZVJJaia9lKEKpmAlYghA6po4EKCAOJgwztz/2d/WbO2efe879vmbmj/1b66w1891z9jn3++7dd5999tkXDMMwDMMwDMMwDMMwDMMwDMMwDMMwDMMwDMMwDMMwDMMwDMMwDMMwDMMwDMMwDMMwjHD6RNbfHzgZeAtwALAXsAvYCqwG7gceBZIaju/twARgXLn/PYCXgeeAVcCfgccj5R4GvMfxeQcwH2gLkDEBGO34/AlgcfnvQcAFSvtHgQcD+qnkA8AbHJ9vA26s+P8iYM9I2SkvAr/LfHYccHRg+5eB/wAbgLXA7oLjeBNwBnAs8Ebku9wFvAA8Biwrl1pdawBMmzbt8MsuuyzmehqNXAu1YiXwUMX/5yLXfZaHgUciZR8ITASOAUYAg5HfZxOwBngAuI+436wf8Cnl2L3AvwJkDAfOdHyeAHMjxvIqE5GbsL0sxFfWAZcgyqwoA4CvAs0B/SXACkQx9A2UP8kj63uBMn6mtP9NRZ0+wJNKvfsD+0kZDPxXkXVdpu4mpV5IWevou7GgrG3Az4EjIs7zMOBWwq619chvGfvgdVIqlerXrFnz8qxZsz4e0exTAeOMKdMy8u9X6oVepyD37z3IAzmv/83AD4ChgbIHeGQ9AvQPHJ+rffTD7k3AnZ4B+coTwCmxHQKnE66osuUh4MiAPiZ5ZOxErLk8QhQWwBVKvQ7goIB+Ui7wjPldmbq9RWGlpQ0oAXU553ghulL2lT9S3QMSgHnz5v0qSZJkxYoVL5ZKpbyxpvRmhXUQsKjgOF5ALPU8fAorAb4dIKMmCut4qrvw0wv1MxF9TiHsyeorrYgZ7WNSjoy/Iaauj1CFdYSnn6/k9FHJzYqMp+hqYfQ2hZWWH3vO7/1U99vf7vgegmloaDhg48aN7UmZ66+/flZg096qsI5DpuXVjuda/PdCnsJ6BRibM9aqFdY4xJdRqx/hYwF9Tq1hf23A2Z6+JgXImJoz3lCFBWIau+ouzekjZRDiG3LJaHTU760KKwHOccgfCLTUQPYnHLKDuOWWWx5KKmhpadldKpVCpkW9UWEdTW3vX58fKU9hJcBy/O6aYIXl0pwDgT8Ae3s6iOUniDPxn8rx9+K+8bK0IRbU6/BPL/oBv0UWB54MH2YnSshUI9ah72IB4ujMciKyeLEhp/3Z6FOeX0eM4x7E7+NjY4S8lxCfZUod4sx9vafNJcCfMp+dDQxT6m9Aro0ngEPK7Ycrdb8MzPOO2MGMGTMmnHnmmcdWfjZs2LC+Y8aMuRFZZPKxFrm+XZyA273wNOJqcfG3nP7y2BeZBobcv9uQxZm8BZqLkQWupoJjOg74OvDDgu29TMevLe9H/CkjkCf/SOB8ZHXB1077gYYgK35au63A5cDhFW3qkC9hDqLEtLb3KH1OyhlrWv6KrhhjLKyD0Kc7X1DkV/J7pe0qpb5mYV0Y0JcLzcJarNQfj0xVte/1kEz9az1135apuz/+qc4BsSe3dOnSlsRBa2tr0tjYeGy+BJVZyhgXRciItbDmK/UTxG/6G+AkOjvDRyCLXBs9bVsRn3aWEAsrQWYIhyljLjwl3A/Y4TnZb+H3E1yK3w/xDkebyz31VyFLsT7eDWzxyDjN0SZUYSXID+kiRmGBKE9X/Xtzzm8g+m9yqdKmpxUWyPeufafZaaHmn2tVZP8Q+c1d5Z1RZwbcfffd610KK0mSZPHixc2x8iroboV1JPr91wq8L6evfZGHtPa7uaaGoQorQcJQXAZAYYXl8yNdmde4zDUeGVmTsh+yjOqquwl9mpDlVPQf6jZH/RiFtQMY5ZARq7A+rdTfjTwoNM5X2rWjT416g8KqR+KmXO2yVqWmsDrQn8o1o6Gh4cjt27d3uBRWR0dHcvXVV4dYwS66W2H9RKmbAB8N7G8IMv12ydgJ7JOpH6OwEmTanqWwwtK+nOeQgM0QBiI3matkrZ1TPScWe5HcoMhxfckxCitBrKCsZRmrsIYgKyauNp/1nNfvlDZLPG16g8LaA7ngXO0uztSdqdRLkMDDUwuOO4+j0j8WLFhwp2ZlrV69ekepVMpbNXbRnQrL9/BfEjnucxQ5CV0XNmIVVitwcEZGsMKqNM/q6eovSJmH3Pgh7AAWKuXuTN1s/FDKLmQuHkM2eDKlHvF3hdCKOJKzvAf4XOR4smzDbe0BnKd8PgB9tXNBgTEcjPzGWqmlNXMK+srQ6sz/d3nkHIJcNw8Bk5FpSy3YB1G44wHWrVt3XnNzs3OHw5gxYwaMGDFCc6z3Fg5HD/b8aaSsW4FnlWPjI+S4FpMGlsdTdbDvWHSteHq1whVuUvp7oICs/ojCccm7JFNXs7BakJvCdWw74pxMibWwAD6ktGnDfbFp9Xfiv3GLhjXcq8iLtbBOQlbCXG020DX6uY7XttnklZ3ICvDJVHfRN5Xl/b3cP9ddd12jZmVt3ry5/YorrtCm4BrdaWF9VKmX0Pm6DeVXiqzlmXo+C+tCxABwHaucVRSysHw3wL/zz68Q2hPhmQKy2pCpa0w/LubgNqEHIz6Cam6S25D4mCz9cAe7apbXHYiDuac5FtnTlpZViCV5D7p/bSZd92p2IMrZFQOWpR74CKIs11JsG9gYXgtofivwcYDJkyd/a/ny5c+7GgwdOrRu7NixCyP76U60a7wD3Vryod3zMffSU8A3lWMz0K8RlUqF5fvRtdWaatH63FFQnjbOAREyEsRB7hrDGVQRnIj4sG5SjmWV015IfJqLmNir/yeD6TylPAqJkdP4K/Aj5dgmZBPxzRH9H4qsGK5Cd2e4mEVnK2865bilZcuWfaKtzb33/ayzzjp+xowZ/6/ZRrVo99IriNKKpRb3Eoir5j7H53ujx6+pVCosn5LwXYTVoH0pRfsbonzu8kv5eBK4TDk2k/DVSxea7+kUOi8OnIHEuWXZTtyUorewBHHm+jJhbEQsrQmIz3NXoOxDET9XSEaJc5DvtpL9Ke9smDJlym133XWXM76tvr6eE044Ida32l1o99JehG1AzlKre6kDMQBedhybSKQBUKmwNnnqHRojNAItwruI83cQuomZF0nuogn4i+PzIci0sSj34p669qdzfNL5SvubkQ3CRViOviCyEPeTsFrWItOvUwmfxi4FPoyklfk0oozac9rsg6TY8d2c9ejR1t+gHNC6cuXKD2zZssVplYwfP/6NTU1N38kZS0+gXeN9KHY/jVE+19wuPp5A3wQ9kwLBviArOlqA4jVFBAZwqdJfB/kBo1nOVWQldF2N9DndKzkMfQ+fFp3vc7qnXKW0vbV8fE/0vWCuQNgs3RXW0AJcj2z3cR1/HreVWIT9gS+hp+tJi2uvYsqUnLa/TyvOnz//t5oDfv369a+USqWQqVF3Ot0P9pxXzCZ7kGnfNkXW1Y66Wr8nVtSrQwyAmHvJ63RvR3wMLi6iayyTxn6Iee0q2TxD2ipTH9wBZhp9kCeki+0U35+1DviucqzQU6GM5oM6DZkOn457L9gG9O1GPcHjyGrPZOX469Gn1rFsBGYjq9l/8NQ7Ufl8P/JTnXyI8gOhubn5orVr1zot2VGjRu0xcuTIG3JkdTfN6PtmP09+9pFKLkZ3yxS9/tKpoes7LXwvaUv6CbKUHLJCttAjI7sTHSQw0FV3F+HxU1/x9OnyOYRaWCCW5wMe+UUsLJBYJM0K+qVyLDTlSU8Ejmp5017BvVOgknORaWO2aPmY9kXf2fAzpc1cpX62/JPyzT179uyvaVbW1q1bO6ZNm5Y31eruSHdfVo2GwP5GIw95l4ytdN0oHWphpVziqZ9rYWUZhCTu0gT8Agn8clGPBIRpbdtxz4s/42mzBX8MWB1iWWkXbwcV0cwVxCgsyuMOTSwXqrC+o7S/Hd0cf3ug7J5QWEehR7b/MUf+7Uq7BPcCRz0Sj+Wq73ooHu0Zm6u8GiO0ZMmSZzWltWjRon/knFd3K6xh+K/TBvw+vuPxJyL4vqNNrMLqi6QGr4nCAlEAPiHPlAd+GrKUPBG5+f6d0+6XSn/1vJYHXit3IHmHjkcco+9ENiWvzGk3T+kzVmGBxJPUUmGNJCxlbVpCYpRSemprjhZMm+B/8PgsgxvoumHW95D7pEP+Ek99V9lEeZVs+vTp79ixY4dTYe3evTu58sortVg56JlsDVqG27T8C5mmT0Ci449Bgk5vxJ+4oAW3WyhWYYEktdS2qVWWIIXVj7gpUOgF4EsHfAy6c7toeQp9aXaS0sansPoh20Py+g1VWKBfjK5yeYRcTWE9iFyYvpJ1qkK4wjoQfeFmNfrT/W2e806QBIgNyE16K7qi30VXf8iHc2Rr5apUwMKFC5dpVtbDDz/sW/nsCYVVjwTx1vJeakcMExdFFBZI5pe8foMzjh6AP59RTNmJbNXI41z8ua1iygv4X3wwSWnnU1gg6Tu0qUhaYhTWFyPOKZtDykd3ZRx1LZr8wCP7a54x31LFmNOSzQayJ8XfD7CL8luRSqXS0JaWljZNac2ZM2eGck49obBA7l8t40KR8iVPX0UVVj9kMczXb1RO9+GIA7KaE32RuJ32E9EdfqHlSfLf0jJJaZunsED3PaUlRmG9gTAlHfs6sJ5UWIPRE8FtRU+lM7Tcd9FxP0rXEIq83yqvvKpY5s6de62msJ5++um2UqnksuZ7SmGB+LOqtbR2ISt7PooqLJBsrD4DwBvWkOUZxGc0m/ygPReLkb1mf45ocyfiII1pk5Igr5R6K12zAdSS6chrxWrBZrpmsHBRJDNDT/ESkl7axRD01arnkXi5IsvmtyE7BSqjvQ8kPy9/HmdTfl9eS0vLF1esWOHaB8rw4cP7jR49+kbXsR7kOSSzwjTC3rOZZSWScFNbda0F/0B8bjVnFKK4fCsICaItb6Lr1ocinITk/s5zzr2IONdDXs2VUo2FBaJUteR0MRYWiCPcd35tuF+k6aMnLSwQc3+N0qYd/76/Pojf6T7yrc/H0UMftPxosWUNZd/bzJkzL2hvb3daWa2trR2NjY3ZvP09aWFVMqI8lv/knOtuZIHiPPJfyZZSjYUF8t2u8IynE7GZB+qQJf5xyBNsEOJkTd/8/AjhebNC2Rux9MYh04nByLTxWURDLy/Q55sR6y/Lfwm/mN6NW5E8Q9wUzpfzCuRcffmiXJxDeMLFLC/RNf/+ODrn1E/ZhL6d5wj01zutJ8xK3Qd5cI1Aps8DkeDZ55Br7TGlXV/kLdk1ecEqsp3qeYCmpqap/fv3dz5Atm3bdsfUqVMrLeajcW9r24B725eLk3G/1OMx4mcSdcgM5BgkP/vrEIPghbKsB/Fv0XPRF/igcuzV7y2Hg3GH7CRU7D4wDMMwDMMwDMMwDMMwDMMwDMMwDMMwDMMwDMMwDMMwDMMwDMMwDMMwDMMwDMMwDMMwYvkfoLwmh4+ZskUAAAAASUVORK5CYII=", "PNG", margin, 4, 65, 12);
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text("Simulation Results", margin, 23);
      y = 45;

      // Scenario info box
      doc.setFillColor(248, 248, 248);
      doc.roundedRect(margin - 4, y - 4, maxWidth + 8, 32, 3, 3, "F");
      addLine("Scenario: " + scenario.purpose, 11, true);
      addLine("Goal: " + scenario.goal, 10);
      y += 4;
      addDivider();

      // Goal Achievement
      addSection("Goal Achievement");
      doc.setFontSize(28);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(232, 54, 93);
      doc.text(outcome.goalPercentage + "%", margin, y + 8);
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 100, 100);
      doc.text("of goal achieved", margin + 28, y + 8);
      // Progress bar
      doc.setFillColor(237, 232, 227);
      doc.roundedRect(margin, y + 14, maxWidth, 6, 3, 3, "F");
      doc.setFillColor(232, 54, 93);
      doc.roundedRect(margin, y + 14, maxWidth * outcome.goalPercentage / 100, 6, 3, 3, "F");
      y += 28;
      addLine(outcome.communicationAnalysis, 10, false, [80, 80, 80]);
      addDivider();

      // Key Insights
      addSection("Key Insights");
      outcome.keyInsights.forEach(i => {
        doc.setFillColor(255, 245, 247);
        doc.roundedRect(margin - 4, y - 4, maxWidth + 8, 10, 2, 2, "F");
        addLine("• " + i, 10, false, [50, 50, 50]);
      });
      addDivider();

      // Conversation
      addSection("Conversation");
      conversation.messages.forEach(m => {
        const isAI = m.type === "ai";
        doc.setFillColor(isAI ? 255 : 245, isAI ? 240 : 245, isAI ? 244 : 250);
        const lines = doc.splitTextToSize((isAI ? "They: " : "You: ") + m.content, maxWidth);
        const blockH = lines.length * 5.5 + 6;
        if (y + blockH > pageHeight - 20) { doc.addPage(); y = margin; }
        doc.setFillColor(isAI ? 255 : 245, isAI ? 240 : 245, isAI ? 244 : 250);
        doc.roundedRect(margin - 4, y - 4, maxWidth + 8, blockH, 2, 2, "F");
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(isAI ? 232 : 30, isAI ? 54 : 30, isAI ? 93 : 30);
        doc.text(isAI ? "They" : "You", margin, y + 1);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(50, 50, 50);
        lines.forEach((line) => {
          if (y > pageHeight - 20) { doc.addPage(); y = margin; }
          doc.text(line, margin, y + 6);
          y += 5.5;
        });
        y += 8;
      });

      // Footer
      doc.setFillColor(232, 54, 93);
      doc.rect(0, pageHeight - 12, pageWidth, 12, "F");
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(255, 255, 255);
      doc.text("Generated by ConversAItion • " + new Date().toLocaleDateString(), margin, pageHeight - 4);

      doc.save("conversation-results-" + new Date().toISOString().split("T")[0] + ".pdf");
    };
    document.head.appendChild(script);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-card border border-border rounded-xl shadow-lg p-8">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-accent text-accent-foreground rounded-full mb-4">
            <i className="fas fa-trophy text-2xl"></i>
          </div>
          <h2 className="text-3xl font-bold text-foreground mb-2">Conversation Complete</h2>
          <p className="text-muted-foreground">Here's how your conversation played out</p>
        </div>
        
        {/* Outcome Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-accent/10 border border-accent/20 rounded-lg p-6">
            <h3 className="font-semibold text-accent mb-2">
              <i className="fas fa-bullseye mr-2"></i>Goal Achievement
            </h3>
            <p className="text-sm text-foreground mb-2" data-testid="text-goal-achievement">
              {outcome.goalAchieved ? 'Goal Achieved' : 'Partial Success'} - {outcome.communicationAnalysis}
            </p>
            <div className="w-full bg-secondary rounded-full h-2">
              <div 
                style={{ background: "#e8365d", height: "100%", borderRadius: 4, transition: "width 0.3s ease", width: `${outcome.goalPercentage}%` }}
                data-testid="progress-goal-achievement"
              ></div>
            </div>
            <p className="text-xs text-muted-foreground mt-1" data-testid="text-goal-percentage">
              {outcome.goalPercentage}% of goal achieved
            </p>
          </div>
          
          <div className="bg-primary/10 border border-primary/20 rounded-lg p-6">
            <h3 className="font-semibold text-primary mb-2">
              <i className="fas fa-comments mr-2"></i>Communication Style
            </h3>
            <p className="text-sm text-foreground mb-2" data-testid="text-communication-analysis">
              {outcome.communicationAnalysis}
            </p>
            <div className="flex flex-wrap gap-2 mt-3">
              {/* Show approaches used */}
              {Array.from(new Set(
                conversation.messages
                  .filter(msg => msg.type === 'user' && msg.approach)
                  .map(msg => msg.approach)
              )).map((approach) => (
                <span 
                  key={approach}
                  className={`px-2 py-1 text-xs rounded-full ${
                    approach === 'approach1' ? 'bg-blue-100 text-blue-800' :
                    approach === 'approach2' ? 'bg-orange-100 text-orange-800' :
                    'bg-green-100 text-green-800'
                  }`}
                  data-testid={`badge-approach-${approach}`}
                >
                  {approach ? approach.charAt(0).toUpperCase() + approach.slice(1) : ''}
                </span>
              ))}
            </div>
          </div>
        </div>
        
        {/* Key Insights */}
        <div className="bg-muted/30 rounded-lg p-6 mb-8">
          <h3 className="font-semibold text-foreground mb-4">
            <i className="fas fa-lightbulb mr-2" style={{ color: "#e8365d" }}></i><span style={{ color: "#e8365d" }}>Key Insights</span>
          </h3>
          <ul className="space-y-2 text-sm text-foreground" data-testid="list-key-insights">
            {outcome.keyInsights.map((insight, index) => (
              <li key={index} className="flex items-start space-x-2">
                <i className="fas fa-check-circle text-accent mt-0.5"></i>
                <span>{insight}</span>
              </li>
            ))}
          </ul>
        </div>
        {/* Feedback Section */}
        <div className="bg-muted/30 rounded-lg p-6 mb-8">
          <h3 className="font-semibold text-foreground mb-4">
            <i className="fas fa-star mr-2" style={{ color: "#e8365d" }}></i>
            <span style={{ color: "#e8365d" }}>Rate your experience</span>
          </h3>
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }} id="star-container">
            {[1,2,3,4,5].map((star) => {
              const savedRating = parseInt(localStorage.getItem(`feedback-rating-${conversation.id}`) || "0");
              const isSubmitted = localStorage.getItem(`feedback-submitted-${conversation.id}`) === "true";
              return (
                <button
                  key={star}
                  onClick={() => {
                    if (isSubmitted) return;
                    document.querySelectorAll('.star-btn').forEach((s: any, i) => {
                      s.style.color = i < star ? "#e8365d" : "#ddd";
                    });
                  }}
                  className="star-btn"
                  style={{ background: "none", border: "none", fontSize: 32, cursor: isSubmitted ? "default" : "pointer", color: star <= savedRating ? "#e8365d" : "#ddd", transition: "color 0.15s" }}
                >★</button>
              );
            })}
          </div>
          <textarea
            id="feedback-text"
            placeholder="Share your feedback about this simulation..."
            disabled={localStorage.getItem(`feedback-submitted-${conversation.id}`) === "true"}
            defaultValue={localStorage.getItem(`feedback-text-${conversation.id}`) || ""}
            style={{ width: "100%", border: "1.5px solid #e8e2dc", borderRadius: 12, padding: "12px 16px", fontSize: 14, fontFamily: "'Poppins', sans-serif", resize: "none", outline: "none", color: "#1a1a1a", background: localStorage.getItem(`feedback-submitted-${conversation.id}`) === "true" ? "#f5f5f5" : "white", boxSizing: "border-box" }}
            rows={3}
          />
          <div style={{ marginTop: 12 }}>
            <Button
              onClick={() => {
                const stars = document.querySelectorAll(".star-btn");
                let rating = 0;
                stars.forEach((s: any, i) => { if (s.style.color === "rgb(232, 54, 93)") rating = i + 1; });
                const feedbackText = (document.getElementById("feedback-text") as HTMLTextAreaElement)?.value?.trim();
                if (!rating || !feedbackText) {
                  const msg = document.getElementById("feedback-msg");
                  if (msg) { msg.textContent = !rating ? "Please select a star rating!" : "Please write your feedback!"; msg.style.color = "#e8365d"; }
                  return;
                }
                const msg = document.getElementById("feedback-msg");
                if (msg) {
                  msg.innerHTML = "✓ Thank you for your feedback! We appreciate it.";
                  msg.style.color = "#3a7c5e";
                  msg.style.fontWeight = "600";
                }
                fetch("/api/feedback", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ rating, feedback: feedbackText, conversationId: conversation.id })
                }).catch(console.error);
                const btn = document.getElementById("submit-feedback-btn") as HTMLButtonElement;
                if (btn) { btn.disabled = true; btn.style.opacity = "0.6"; btn.textContent = "Submitted ✓"; }
                  localStorage.setItem(`feedback-submitted-${conversation.id}`, "true");
                  localStorage.setItem(`feedback-rating-${conversation.id}`, String(rating));
                  const feedbackVal = (document.getElementById("feedback-text") as HTMLTextAreaElement)?.value;
                  localStorage.setItem(`feedback-text-${conversation.id}`, feedbackVal || "");
                  stars.forEach((s: any) => { (s as HTMLButtonElement).disabled = true; s.style.cursor = "default"; });
                  const ta = document.getElementById("feedback-text") as HTMLTextAreaElement;
                  if (ta) { ta.disabled = true; ta.style.background = "#f5f5f5"; }
              }}
              id="submit-feedback-btn"
              disabled={localStorage.getItem(`feedback-submitted-${conversation.id}`) === "true"}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {localStorage.getItem(`feedback-submitted-${conversation.id}`) === "true" ? "Submitted ✓" : "Submit Feedback"}
            </Button>
            <p id="feedback-msg" style={{ fontSize: 14, marginTop: 10, color: "#3a7c5e", fontWeight: 600 }}>{localStorage.getItem(`feedback-submitted-${conversation.id}`) === "true" ? "✓ Thank you for your feedback! We appreciate it." : ""}</p>
          </div>
        </div>

        
        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            onClick={handleStartNew}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
            data-testid="button-start-new"
          >
            <i className="fas fa-plus mr-2"></i>
            Start New Simulation
          </Button>
          <Button 
            variant="secondary"
            onClick={handleExport}
            data-testid="button-export-results"
          >
            <i className="fas fa-download mr-2"></i>
            Export Results
          </Button>
        </div>
      </div>
    </div>
  );
}
