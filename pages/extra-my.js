import { ethers } from 'ethers'
import { useEffect, useState } from 'react'
import { supabase } from '../client'
import axios from 'axios'
import Web3Modal from "web3modal"

import {
  pikblockextraaddress, pikblockextraMarketaddress
} from '../config'

import PIKBLOCKEXTRA from '../artifacts/contracts/PIKBLOCKEXTRA.sol/PIKBLOCKEXTRA.json'
import PIKBLOCKEXTRAMarket from '../artifacts/contracts/PIKBLOCKEXTRAMarket.sol/PIKBLOCKEXTRAMarket.json'

export default function MyAssets() {
  const [nfts, setNfts] = useState([])
  const [loadingState, setLoadingState] = useState('not-loaded')
  useEffect(() => {
    loadNFTs()
  }, [])
  async function loadNFTs() {
    const web3Modal = new Web3Modal({
      network: "mainnet",
      cacheProvider: true,
    })
    const connection = await web3Modal.connect()
    const provider = new ethers.providers.Web3Provider(connection)
    const signer = provider.getSigner()
      
    const marketContract = new ethers.Contract(pikblockextraMarketaddress, PIKBLOCKEXTRAMarket.abi, signer)
    const tokenContract = new ethers.Contract(pikblockextraaddress, PIKBLOCKEXTRA.abi, provider)
    const data = await marketContract.fetchMyNFTs()
    
    const items = await Promise.all(data.map(async i => {
      const tokenUri = await tokenContract.tokenURI(i.tokenId)
      const meta = await axios.get(tokenUri)
      let price = ethers.utils.formatUnits(i.price.toString(), 'ether')
      let item = {
        price,
        tokenId: i.tokenId.toNumber(),
        seller: i.seller,
        owner: i.owner,
        image: meta.data.image,
      }
      return item
    }))
    setNfts(items)
    setLoadingState('loaded') 
  }
  if (loadingState === 'loaded' && !nfts.length) return (<h1 className="py-10 px-20 text-3xl">No assets owned</h1>)
  return (
    <div className="flex justify-center">
      <div className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-5 pt-5 flex items-end">
          {
            nfts.map((nft, i) => (
              <div key={i} className="border shadow rounded-xl overflow-hidden">
                <img src={nft.image} className="rounded" />
                <div className="p-4 bg-black">
                  <p className="text-2xl font-bold text-white">Price - {nft.price} xDai</p>
                </div>
              </div>
            ))
          }
        </div>
      </div>
    </div>
  )
}
// export async function getServerSideProps({ req }) {
//   const { user } = await supabase.auth.api.getUserByCookie(req)

//   if (!user) {
//     return { props: {}, redirect: { destination: '/sign-in' } }
//   }

//   return { props: { user } }
// }