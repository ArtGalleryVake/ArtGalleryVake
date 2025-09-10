import React from 'react'
import "../styles/Landing.css"
const img = '/landing.png'

function Landing() {
  return (
    <div className='landing-container'>
        <div className="landing-header">
            <div className="logo-container">
                <p>Art Gallery</p>
                <p>Vake</p>
            </div>
            <div className="nav-links">
                <a href="/home" className="nav-link">ავტორები</a>
                <a href="/home" className="nav-link">ნამუშევრები</a>
                <a href="/home" className="nav-link">გამოფენები</a>
                <a href="/admin" className="nav-link">კონტაქტი</a>
            </div>
        </div>

        <div className="main-content">
            <div className="box1">
                <div className="main-text">
                    <h1>Art Galley Vake</h1>
                </div>
                <div className="secondary-text">
                    <p>Lorem ipsum dolor sit amet consectetur adipisicing 
                        elit. Architecto earum culpa veritatis deleniti est,
                         eligendi debitis harum reiciendis dolorum explicabo. </p>

                    <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. </p>     

                </div>

            </div>
            <div className="box2">
                <div className="image-container">
                    <img src={img} alt="mikava" className='landing-img' />

                </div>

            </div>
        </div>
      
    </div>
  )
}

export default Landing
