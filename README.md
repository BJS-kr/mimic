# Mimic
Nest.js를 모방한다는 의미로 mimic이라고 이름을 붙였습니다.  
구현 사양이 작습니다. 핵심 flow위주로 작성되어 있습니다.  
필요하다면 데코레이터를 작성하고 factory에서 추가하는 식으로 기능을 확장할 수 있습니다.  

**1. src/에는 Nest.js를 사용했을 경우를 가정한 서버 소스코드가 있습니다.**  
**2. 프레임워크 코드는 mimic/에 작성되어있습니다.**  


# 구현 중점
0. Nest.js를 사용하는 코드와 동일한 형태의 코드 작성 가능
1. reflect-metadata를 이용해 metadata 조작
2. decorator를 이용해 metadata를 수집하고 factory에서 context구성

# 구현되지 않은 것들
1. 트리 형태의 context collect & resolve -> metadata조작 및 빌드가 핵심이기 때문에 제외
2. guard, interceptor등 -> 프로젝트 목적에서 벗어난다고 생각해서 제외
3. express 기반 구현 -> 사양이 작아 express의 극히 일부만을 사용하게 되기 때문에 native module http로 구현
4. 그 외 수 많은 내장 기능들(nest-cli, 각종 out-of-box 모듈 등)

