"""Knowledge Base Loader - Simple RAG for Vertex AI"""

import os
import re
from typing import List, Dict, Optional


class KnowledgeBase:
    """Simple knowledge base loader and retriever"""

    def __init__(self, kb_path: Optional[str] = None):
        self.kb_path = kb_path or os.path.expanduser("~/Desktop/Vertex/知识库")
        self.documents: List[Dict[str, str]] = []
        self._loaded = False

    def load(self) -> bool:
        """Load knowledge base documents"""
        if not os.path.exists(self.kb_path):
            print(f"[KB] 知识库目录不存在: {self.kb_path}")
            return False

        try:
            import docx
            for fname in os.listdir(self.kb_path):
                fpath = os.path.join(self.kb_path, fname)
                if fname.endswith('.docx'):
                    try:
                        doc = docx.Document(fpath)
                        text = '\n'.join([p.text for p in doc.paragraphs if p.text.strip()])
                        if text.strip():
                            self.documents.append({
                                "title": fname,
                                "content": text,
                                "type": "docx"
                            })
                            print(f"[KB] 已加载: {fname} ({len(text)} chars)")
                    except Exception as e:
                        print(f"[KB] 加载失败 {fname}: {e}")

            self._loaded = True
            print(f"[KB] 知识库加载完成: {len(self.documents)} 篇文档")
            return True
        except ImportError:
            print("[KB] python-docx 未安装，跳过文档加载")
            return False
        except Exception as e:
            print(f"[KB] 加载错误: {e}")
            return False

    def search(self, query: str, top_k: int = 3) -> List[Dict[str, str]]:
        """Simple keyword-based search over knowledge base"""
        if not self._loaded or not self.documents:
            return []

        query_lower = query.lower()
        # Extract Chinese keywords (2+ chars)
        keywords = set()
        keywords.update(re.findall(r'[一-鿿]{2,}', query))
        # Extract English keywords
        keywords.update(re.findall(r'\b[a-zA-Z]{3,}\b', query_lower))

        scored = []
        for doc in self.documents:
            content_lower = doc["content"].lower()
            score = 0
            matched_kws = []
            for kw in keywords:
                count = content_lower.count(kw if kw.isascii() else kw)
                if count > 0:
                    score += count * (2 if len(kw) >= 4 else 1)
                    matched_kws.append(kw)

            if score > 0:
                # Extract relevant snippet
                snippet = self._extract_snippet(doc["content"], matched_kws)
                scored.append({
                    "title": doc["title"],
                    "score": score,
                    "snippet": snippet,
                    "matched_keywords": matched_kws,
                })

        scored.sort(key=lambda x: x["score"], reverse=True)
        return scored[:top_k]

    def _extract_snippet(self, text: str, keywords: List[str], context_chars: int = 200) -> str:
        """Extract relevant snippet around matched keywords"""
        if not keywords:
            return text[:300]

        for kw in keywords:
            idx = text.find(kw)
            if idx > 0:
                start = max(0, idx - context_chars)
                end = min(len(text), idx + len(kw) + context_chars)
                snippet = text[start:end]
                if start > 0:
                    snippet = "..." + snippet
                if end < len(text):
                    snippet = snippet + "..."
                return snippet

        return text[:300]

    def get_context(self, query: str) -> str:
        """Get formatted context string for AI prompt"""
        results = self.search(query)
        if not results:
            return ""

        parts = ["【知识库参考信息】"]
        for r in results:
            parts.append(f"\n📄 {r['title']} (相关度: {r['score']})")
            parts.append(f"{r['snippet']}")

        return "\n".join(parts)

    def get_all_keywords(self) -> List[str]:
        """Get all unique keywords from knowledge base for matching"""
        all_kws = set()
        for doc in self.documents:
            # Extract potential e-commerce keywords
            patterns = [
                r'[一-鿿]{2,6}(?:值|率|价|分|数|线|额)',  # 蓝海值, 利润率...
                r'(?:ROI|ACOS|LTV|FBA|FBM|BSR|SKU|ASIN|SEO)',
                r'(?:选品|蓝海|竞品|类目|利润|货源|退货|合规|流量|广告)',
                r'\b\d+%\b',  # percentages
            ]
            for p in patterns:
                all_kws.update(re.findall(p, doc["content"]))

        return list(all_kws)


# Singleton
_kb_instance: Optional[KnowledgeBase] = None


def get_knowledge_base() -> KnowledgeBase:
    """Get singleton knowledge base instance"""
    global _kb_instance
    if _kb_instance is None:
        _kb_instance = KnowledgeBase()
        _kb_instance.load()
    return _kb_instance


def search_knowledge(query: str) -> str:
    """Quick search knowledge base"""
    kb = get_knowledge_base()
    return kb.get_context(query)
