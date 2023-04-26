import Image from 'next/image'
import styles from './page.module.css'
import Head from 'next/head'

export default function Home() {
  return (
    <main className={styles.main}>
      <h1>Heading in <code>src/app/page.tsx</code></h1>
      <p>Lorem ipsum dolor, sit amet consectetur adipisicing elit. Tempore dolorem perferendis et eveniet rem expedita accusantium eius, voluptatum sequi blanditiis quibusdam beatae quasi enim, ullam ratione libero? Inventore, beatae amet.</p>
      <p>Lorem ipsum dolor sit amet consectetur, adipisicing elit. Possimus sed dolore deleniti dolorum hic vero!</p>
      <p>Cupcake ipsum dolor sit amet. Tootsie roll shortbread dragée tart fruitcake halvah chupa chups danish. Pie tart cake gummies lemon drops dragée chocolate cake powder. Cotton candy sweet dessert sweet roll jelly. Cake cupcake fruitcake sweet dessert wafer wafer pie. Pie jelly marzipan jelly sweet roll. Chocolate dragée sugar plum cake powder. Tootsie roll pudding ice cream chupa chups cotton candy pastry gummi bears muffin. Lollipop jelly beans tart tart chocolate bar donut pastry carrot cake soufflé. Jelly beans biscuit liquorice cake croissant wafer cotton candy pastry croissant. Candy canes cupcake cookie danish jelly beans wafer fruitcake. Tart gummies dessert cotton candy topping oat cake. Sweet roll fruitcake icing jelly marshmallow cookie dessert bonbon.</p>
    </main>
  )
}
