
/**
 * By command:
 *   cd public; find . -mindepth 1 -maxdepth 1
 */
const data = `
IMG_1631.jpg,New Star Karaoke,1.jpg
IMG_0707.jpg,A.D.P.T,2.jpg
IMG_0717.jpg,GeekCar,3.jpg
IMG_0475.jpg,Realtisan,4.jpg
IMG_0361.jpg,Beetroot Media,5.jpg
IMG_0895.jpg,Concept Wraps,6.jpg
IMG_1165.png,Miniso
IMG_1209.jpg,Australian Yacht Club
IMG_1317.jpg,悉尼印象
IMG_1707.jpg,Victor
IMG_1846.jpg,Chi Lee Skewer
IMG_1857.jpg,TRON Marketing
IMG_1908.jpg,锅过瘾
IMG_2021.jpg,D1
IMG_2042.jpg,HYPOXI
IMG_2068.jpg,PENANG HAWKER
IMG_2091.jpg,Jessie's Coffee School
IMG_2097.jpg,Wokking Inn
IMG_2102.png,Mango Tree
IMG_2181.jpg,F2 Dance Studios
IMG_2206.jpg,Ya-Malaysia
IMG_2218.jpg,Garden of Eden Florist
IMG_2303.jpg,渝人码头
IMG_2355.jpg,北京范儿
IMG_2379.jpg,Dix Studio
IMG_2579.jpg,Japanese Yakiniku Ginza
IMG_2707.jpg,X-Five Prestige Peakhurst
IMG_2714.jpg,UBC
IMG_2789.jpg
IMG_4201.jpg
IMG_4550.jpg
IMG_5671.jpg
IMG_7800.jpg 
IMG_7858.png
IMG_7890.jpg
IMG_8388.jpg,Monster Skewer 怪兽烧
IMG_8484.jpg
IMG_8491.jpg,围龙
IMG_8499.jpg,小湖南
IMG_8524.jpg
IMG_8532.jpg
IMG_8634.jpg
IMG_8637.png
IMG_8638.jpg
IMG_8722.jpg
IMG_9124.jpg
IMG_9135.jpg
IMG_9153.jpg
IMG_9172.jpg
IMG_9179 2.jpg
IMG_9185.png
IMG_9251.jpg
IMG_9388.gif
IMG_9451.jpg
IMG_9528.jpg
IMG_9530.jpg
IMG_9535.jpg
IMG_9537.jpg
IMG_9572.jpg
IMG_9649.jpg
IMG_9652.jpg
IMG_9720.jpg
IMG_9721.jpg
IMG_9735.jpg
IMG_9743.jpg
IMG_9843.jpg
IMG_9850.jpg
`;

export const getVenderData = () => {
  return data.split('\n')
  .filter(x => !!x)
  .map(x => {
    const parts = x.split(',');
    return {
      file: `venders/${parts[0]}`,
      name: parts[1],
      picture: `images/${parts[2]}`
    }
  })
  .filter(x => x.name);
}