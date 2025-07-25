# Jung's Research Assistant

Azure OpenAI API를 사용하는 논문 검색 AI 어시스턴트입니다.

## Getting Started

### 1. 환경 변수 설정

프로젝트 루트에 `.env.local` 파일을 생성하고 다음 내용을 추가하세요:

```bash
# Azure OpenAI API 설정
AZURE_OPENAI_API_KEY=your-api-key-here

# Azure OpenAI 엔드포인트 (예: https://your-resource-name.openai.azure.com)
AZURE_OPENAI_ENDPOINT=https://your-resource-name.openai.azure.com

# Azure OpenAI 배포 이름 (예: gpt-35-turbo)
AZURE_OPENAI_DEPLOYMENT=gpt-35-turbo
```

**중요**: 
- `AZURE_OPENAI_API_KEY`를 실제 Azure OpenAI API 키로 변경하세요
- `AZURE_OPENAI_ENDPOINT`를 실제 Azure OpenAI 리소스의 엔드포인트로 변경하세요
- `AZURE_OPENAI_DEPLOYMENT`를 실제 배포 이름으로 변경하세요

### 2. 개발 서버 실행

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
