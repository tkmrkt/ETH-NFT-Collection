// App.js
// useEffect と useState 関数を React.js からインポートしています。
import myEpicNft from "./utils/MyEpicNFT.json";
import { ethers } from "ethers";
import React, { useEffect, useState, useRef } from "react";
import "./styles/App.css";
import twitterLogo from "./assets/twitter-logo.svg";

// Constantsを宣言する: constとは値書き換えを禁止した変数を宣言する方法です。
const TWITTER_HANDLE = "あなたのTwitterのハンドルネームを貼り付けてください";
const TWITTER_LINK = `https://twitter.com/${TWITTER_HANDLE}`;
const CONTRACT_ADDRESS =
"0xfd72cACD27Ff27aec4e1465777aaA06AEF504169";

const App = () => {
  /*
   * ユーザーのウォレットアドレスを格納するために使用する状態変数を定義します。
   */
  const [currentAccount, setCurrentAccount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isNotSepolia, setIsNotSepolia] = useState(false);
  const [tokenIds, setTokenIds] = useState([]);
  const setupsRef = useRef(0);

  /*この段階でcurrentAccountの中身は空*/
  console.log("currentAccount: ", currentAccount);
  /*
   * ユーザーが認証可能なウォレットアドレスを持っているか確認します。
   */
  const checkIfWalletIsConnected = async () => {
    const { ethereum } = window;
    if (!ethereum) {
      console.log("Make sure you have MetaMask!");
      return;
    } else {
      console.log("We have the ethereum object", ethereum);
    }
    /* ユーザーが認証可能なウォレットアドレスを持っている場合は、
     * ユーザーに対してウォレットへのアクセス許可を求める。
     * 許可されれば、ユーザーの最初のウォレットアドレスを
     * accounts に格納する。
     */
    const accounts = await ethereum.request({ method: "eth_accounts" });

    if (accounts.length !== 0) {
      const account = accounts[0];
      console.log("Found an authorized account:", account);
      setCurrentAccount(account);
    
      // **** イベントリスナーをここで設定 ****
      // この時点で、ユーザーはウォレット接続が済んでいます。
      setupEventListener();

      let chainId = await ethereum.request({ method: "eth_chainId" });
      console.log("Connected to chain " + chainId);
      // 0xaa36a7(11155111) は　Sepolia の ID です。
      const sepoliaChainId = "0xaa36a7";
      if (chainId !== sepoliaChainId) {
        alert("You are not connected to the Sepolia Test Network!");
        setIsNotSepolia(true);
      } else {
        setIsNotSepolia(false);
      }

    } else {
      console.log("No authorized account found");
    }
    const provider = new ethers.providers.Web3Provider(ethereum);
    const signer = provider.getSigner();
    // NFT が発行されます。
    const connectedContract = new ethers.Contract(
      CONTRACT_ADDRESS,
      myEpicNft.abi,
      signer
    );
    const _totalMints = await connectedContract.getTotalMints();
    const _tokenIds = [...Array(Number(_totalMints)).keys()];
    setTokenIds(_tokenIds);

  };

  /*
   * connectWallet メソッドを実装します。
   */
  const connectWallet = async () => {
    try {
      const { ethereum } = window;
      if (!ethereum) {
        alert("Get MetaMask!");
        return;
      }
      /*
       * ウォレットアドレスに対してアクセスをリクエストしています。
       */
      const accounts = await ethereum.request({
        method: "eth_requestAccounts",
      });
      console.log("Connected", accounts[0]);
      /*
       * ウォレットアドレスを currentAccount に紐付けます。
       */
      setCurrentAccount(accounts[0]);

      // **** イベントリスナーをここで設定 ****
      setupEventListener();      
    } catch (error) {
      console.log(error);
    }
  };

  const listener = (from, tokenId) => {
    console.log(from, tokenId.toNumber());
    alert(
      `あなたのウォレットに NFT を送信しました。gemcase に表示されるまで数分かかることがあります。NFT へのリンクはこちらです: https://gemcase.vercel.app/view/evm/sepolia/${CONTRACT_ADDRESS}/${tokenId.toNumber()}`,
    );
  }
  // App.js
  // setupEventListener 関数を定義します。
  // MyEpicNFT.sol の中で event が　emit された時に、
  // 情報を受け取ります。
  const setupEventListener = async () => {
    try {
      const { ethereum } = window;
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        // NFT が発行されます。
        const connectedContract = new ethers.Contract(
          CONTRACT_ADDRESS,
          myEpicNft.abi,
          signer
        );
        // Event が　emit される際に、コントラクトから送信される情報を受け取っています。
        if (setupsRef.current === 0) {
          connectedContract.on("NewEpicNFTMinted", listener);
          console.log("Setup event listener!");
        }
        setupsRef.current = setupsRef.current + 1;
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error);
    }
  };  

  const askContractToMintNft = async () => {
    try {
      const { ethereum } = window;
      if (ethereum) {
        setIsLoading(true);
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const connectedContract = new ethers.Contract(
          CONTRACT_ADDRESS,
          myEpicNft.abi,
          signer
        );
        console.log("Going to pop wallet now to pay gas...");
        const params = {
          value: ethers.utils.parseEther("0.00001")
        };        
        let nftTxn = await connectedContract.makeAnEpicNFT(params).catch((e) => alert(e.message));
        console.log("Mining...please wait.");
        await nftTxn.wait().catch((e) => alert(e.message));
        setIsLoading(false);  
        console.log(
          `Mined, see transaction: https://sepolia.etherscan.io/tx/${nftTxn.hash}`
        );
        const _totalMints = await connectedContract.getTotalMints();
        const _tokenIds = [...Array(Number(_totalMints)).keys()];
        setTokenIds(_tokenIds);
    
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      setIsLoading(false);  
      console.log(error);
    }
  };  

  // renderNotConnectedContainer メソッドを定義します。
  const renderNotConnectedContainer = () => (
    <button
      onClick={connectWallet}
      className="cta-button connect-wallet-button"
    >
      Connect to Wallet
    </button>
  );
  const renderConnectedContainer = () => {
    return isLoading ? 
      (<span className="loading">Loading...</span>) : isNotSepolia ? (<></>) :
      (<button onClick={askContractToMintNft} className="cta-button connect-wallet-button">
        Mint NFT
      </button>);
  }
  const handleClickToken = (id) => {
    window.open(`https://gemcase.vercel.app/view/evm/sepolia/${CONTRACT_ADDRESS}/${id}`)
  }
  /*
   * ページがロードされたときに useEffect()内の関数が呼び出されます。
   */
  useEffect(() => {
    checkIfWalletIsConnected();
  }, []);
  return (
    <div className="App">
      <div className="container">
        <div className="header-container">
          <p className="header gradient-text">My NFT Collection</p>
          <p className="sub-text">あなただけの特別な NFT を Mint しよう💫</p>
          {/*条件付きレンダリングを追加しました
          // すでに接続されている場合は、
          // Connect to Walletを表示しないようにします。*/}
          {currentAccount === ""
            ? renderNotConnectedContainer()
            : renderConnectedContainer()
          }
          {tokenIds.map(id => (<button onClick={() => handleClickToken(id + 1)} className="cta-button gem-button">{`gemcase:${id + 1}`}</button>))}
        </div>
        <div className="footer-container">
          <img alt="Twitter Logo" className="twitter-logo" src={twitterLogo} />
          <a
            className="footer-text"
            href={TWITTER_LINK}
            target="_blank"
            rel="noreferrer"
          >{`built on @${TWITTER_HANDLE}`}</a>
        </div>
      </div>
    </div>
  );
};
export default App;