import styled from "styled-components"

const LinkedinButton = ({ link, disabled }) => {
    const handleClick = () => {
        if (disabled) return
        window.open(
            link.startsWith("http") ? link : `https://${link}`,
            "_blank"
        )
    }

    return (
        <StyledWrapper>
            <button
                className={`LinkedinBtn ${disabled ? "disabled" : ""}`}
                onClick={handleClick}
                disabled={disabled}
            >
                <div className="BG" />
                <div className="svgContainer">
                    <span>in</span>
                </div>
            </button>
        </StyledWrapper>
    )
}

const StyledWrapper = styled.div`
  .LinkedinBtn {
    width: 45px;
    height: 45px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: none;
    background: transparent;
    position: relative;
    border-radius: 7px;
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .LinkedinBtn.disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }

  .svgContainer {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    backdrop-filter: blur(4px);
    border-radius: 10px;
    transition: all 0.3s ease;
    border: 1px solid rgba(156, 156, 156, 0.466);
    font-weight: bold;
    color: white;
    z-index: 1;
  }

  .BG {
    position: absolute;
    width: 100%;
    height: 100%;
    background: #0077b5;
    z-index: 0;
    border-radius: 9px;
    transition: all 0.3s ease;
  }

  .LinkedinBtn:not(.disabled):hover {
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.2);
  }

  .LinkedinBtn:not(.disabled):hover .BG {
    transform: rotate(35deg);
    transform-origin: bottom;
  }

  .LinkedinBtn:not(.disabled):hover .svgContainer {
    background-color: rgba(156, 156, 156, 0.25);
  }
`

export default LinkedinButton
