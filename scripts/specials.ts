import { AttachmentBuilder, TextChannel } from "discord.js";

export function sparkleAprilFools2025(channelCommand: TextChannel) {
  const letterMsg = `<@&1200618996970561629>
# 嘿，開拓者！

## 你猜怎麼著？
我今天早上發現了一個超瘋狂的社交軟件，名字叫什麼 *「邦不了」*
管它叫什麼，反正超好玩！裏面超多有趣的內容，簡直完美適合我的下一個惡作劇。

已經截圖了，現在發給你，保證你笑到*摔倒*，忘了上車的事。後會有期。

「焰錦遊魚」
花火❤️

-# 2025年4月1日
`
  const attach = new AttachmentBuilder("./assets/images/20250401.png", { name: '20250401.png' })
  channelCommand.send({content: letterMsg, files: [attach]}
  );
}