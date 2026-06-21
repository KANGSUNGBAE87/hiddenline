import { tossBrandConfig } from "./src/platform/tossBrand";

export default {
  appsInToss: {
    brand: tossBrandConfig,
    navigationBar: {
      gameMode: true,
      closeConfirmation: {
        title: "숨은선을 종료할까요?",
        cancelText: "닫기",
        confirmText: "종료하기",
      },
    },
  },
};
