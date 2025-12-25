"use client"

import { useEffect, useState, useRef } from "react"
import { createBrowserClient } from "@/lib/supabase/client"
import { QRCodeSVG } from "qrcode.react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Download, ArrowLeft, Loader2, Palette, Type, Layout } from "lucide-react"
import Link from "next/link"
import { useParams } from "next/navigation"
import html2canvas from "html2canvas"
import jsPDF from "jspdf"

export default function PosterEditorPage() {
    const params = useParams()
    const id = params.id as string
    const [item, setItem] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [generating, setGenerating] = useState(false)
    const posterRef = useRef<HTMLDivElement>(null)
    const supabase = createBrowserClient()

    // Editor State
    const [headline, setHeadline] = useState("")
    const [description, setDescription] = useState("")
    const [showReward, setShowReward] = useState(true)
    const [themeColor, setThemeColor] = useState<"red" | "green" | "blue" | "black">("red")

    useEffect(() => {
        async function fetchItem() {
            console.log("[PosterEditor] Fetching item with ID:", id)

            // Get current user
            const { data: { user } } = await supabase.auth.getUser()

            const { data, error } = await supabase
                .from("items")
                .select("*, profiles(full_name, email)")
                .eq("id", id)
                .single()

            console.log("[PosterEditor] Fetch result:", { data, error })

            if (error || !data) {
                console.error("[PosterEditor] Error fetching item:", error)
                setLoading(false)
                return
            }

            // Check ownership and status
            if (data.user_id !== user?.id || data.status !== 'lost') {
                console.error("[PosterEditor] Unauthorized access or invalid item status")
                setItem(null)
                setLoading(false)
                return
            }

            setItem(data)
            // Initialize state
            setHeadline('LOST ITEM')
            setDescription(data.description || "")
            setThemeColor('red')
            setShowReward(!!data.reward_amount)
            setLoading(false)
        }

        if (id) {
            fetchItem()
        }
    }, [id, supabase])

    const handleDownload = async () => {
        if (!posterRef.current) return
        setGenerating(true)

        try {
            // Wait for images to load
            const images = posterRef.current.getElementsByTagName("img")
            await Promise.all(Array.from(images).map(img => {
                if (img.complete) return Promise.resolve()
                return new Promise(resolve => {
                    img.onload = resolve
                    img.onerror = resolve
                })
            }))

            const canvas = await html2canvas(posterRef.current, {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: "#ffffff",
                allowTaint: false,
                width: posterRef.current.offsetWidth,
                height: posterRef.current.offsetHeight
            })

            const imgData = canvas.toDataURL("image/png")
            const pdf = new jsPDF({
                orientation: "portrait",
                unit: "mm",
                format: "a4",
            })

            const pdfWidth = pdf.internal.pageSize.getWidth()
            const pdfHeight = pdf.internal.pageSize.getHeight()

            // Calculate the aspect ratio to maintain A4 proportions
            const canvasAspectRatio = canvas.width / canvas.height
            const pdfAspectRatio = pdfWidth / pdfHeight

            let imgWidth = pdfWidth
            let imgHeight = pdfHeight

            // Adjust dimensions to fit A4 without distortion
            if (canvasAspectRatio > pdfAspectRatio) {
                imgHeight = pdfWidth / canvasAspectRatio
            } else {
                imgWidth = pdfHeight * canvasAspectRatio
            }

            pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight)
            pdf.save(`findit-poster-${item.status}-${item.title.substring(0, 10)}.pdf`)
        } catch (error) {
            console.error("Error generating PDF:", error)
            alert("Failed to generate PDF. Please try again.")
        } finally {
            setGenerating(false)
        }
    }

    if (loading) return <div className="flex justify-center items-center h-screen">Loading...</div>
    if (!item) return <div className="flex justify-center items-center h-screen">Item not found</div>

    const itemUrl = `${window.location.origin}/items/${item.id}`

    // Theme configurations
    const themes = {
        red: { border: "border-red-600", bg: "bg-red-50", text: "text-red-600" },
        green: { border: "border-green-600", bg: "bg-green-50", text: "text-green-600" },
        blue: { border: "border-blue-600", bg: "bg-blue-50", text: "text-blue-600" },
        black: { border: "border-slate-900", bg: "bg-slate-50", text: "text-slate-900" },
    }

    const currentTheme = themes[themeColor]

    return (
        <div className="min-h-screen bg-slate-100 text-black flex flex-col md:flex-row">

            {/* Sidebar Editor */}
            <div className="w-full md:w-96 bg-white border-r shadow-lg flex flex-col h-screen sticky top-0 z-10 overflow-y-auto">
                <div className="p-4 border-b bg-slate-50 flex items-center justify-between">
                    <Link href={`/items/${item.id}`} className="flex items-center text-sm text-muted-foreground hover:text-foreground">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back
                    </Link>
                    <h2 className="font-semibold">Poster Designer</h2>
                </div>

                <div className="p-6 space-y-8 flex-1">

                    {/* Content Controls */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-sm font-medium text-slate-500 mb-2">
                            <Type className="h-4 w-4" />
                            <span>Text Content</span>
                        </div>

                        <div className="space-y-2">
                            <Label>Headline</Label>
                            <Input
                                value={headline}
                                onChange={(e) => setHeadline(e.target.value)}
                                maxLength={20}
                                placeholder="e.g. LOST ITEM"
                            />
                            <p className="text-xs text-muted-foreground">{headline.length}/20 characters</p>
                        </div>

                        <div className="space-y-2">
                            <Label>Description</Label>
                            <Textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={5}
                                maxLength={300}
                                placeholder="Describe the item..."
                            />
                            <p className="text-xs text-muted-foreground text-right">{description.length}/300</p>
                        </div>
                    </div>

                    <div className="h-px bg-slate-200" />

                    {/* Appearance Controls */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-sm font-medium text-slate-500 mb-2">
                            <Palette className="h-4 w-4" />
                            <span>Appearance</span>
                        </div>

                        <div className="space-y-2">
                            <Label>Theme Color</Label>
                            <div className="flex gap-3">
                                {(Object.keys(themes) as Array<keyof typeof themes>).map((color) => (
                                    <button
                                        key={color}
                                        onClick={() => setThemeColor(color)}
                                        className={`w-10 h-10 rounded-full border-2 transition-all ${themeColor === color ? 'ring-2 ring-offset-2 ring-slate-400 scale-110' : 'opacity-70 hover:opacity-100'} ${color === 'red' ? 'bg-red-500 border-red-600' : color === 'green' ? 'bg-green-500 border-green-600' : color === 'blue' ? 'bg-blue-500 border-blue-600' : 'bg-slate-900 border-black'}`}
                                        title={color.charAt(0).toUpperCase() + color.slice(1)}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="h-px bg-slate-200" />

                    {/* Options */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-sm font-medium text-slate-500 mb-2">
                            <Layout className="h-4 w-4" />
                            <span>Options</span>
                        </div>

                        {item.reward_amount && (
                            <div className="flex items-center justify-between">
                                <Label htmlFor="show-reward">Show Reward Badge</Label>
                                <Switch
                                    id="show-reward"
                                    checked={showReward}
                                    onCheckedChange={setShowReward}
                                />
                            </div>
                        )}

                        <div className="text-xs text-muted-foreground bg-blue-50 p-3 rounded-lg border border-blue-200">
                            <p className="font-medium text-blue-900 mb-1">Note:</p>
                            <p>QR Code and FindIt branding are mandatory and will always appear on the poster.</p>
                        </div>
                    </div>

                </div>

                <div className="p-4 border-t bg-slate-50">
                    <Button onClick={handleDownload} disabled={generating} className="w-full" size="lg">
                        {generating ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Generating PDF...
                            </>
                        ) : (
                            <>
                                <Download className="mr-2 h-4 w-4" />
                                Download Poster
                            </>
                        )}
                    </Button>
                </div>
            </div>

            {/* Preview Area */}
            <div className="flex-1 bg-slate-200 p-4 md:p-8 overflow-auto flex justify-center items-start min-h-screen">

                <div className="space-y-4 w-full max-w-[210mm]">
                    <div className="text-center text-sm text-slate-500">
                        Live Preview
                    </div>

                    <div
                        ref={posterRef}
                        className="w-[210mm] h-[297mm] bg-white relative flex flex-col border shadow-2xl p-12 shrink-0 transition-all duration-300 mx-auto"
                        style={{
                            transformOrigin: "top center",
                            fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
                            minHeight: "297mm",
                            maxHeight: "297mm"
                        }}
                    >

                        {/* Header */}
                        <div className={`text-center py-6 mb-8 border-4 transition-colors duration-300 ${currentTheme.border} ${currentTheme.bg}`}>
                            <h1 className={`text-8xl font-black uppercase tracking-tighter transition-colors duration-300 ${currentTheme.text}`}>
                                {headline || "HEADLINE"}
                            </h1>
                            <p className="text-2xl font-bold mt-2 uppercase tracking-widest text-slate-700">
                                Have you seen this item?
                            </p>
                        </div>

                        {/* Main Image */}
                        <div className="aspect-video w-full bg-slate-100 mb-8 border-2 border-slate-200 rounded-lg overflow-hidden flex items-center justify-center">
                            {item.image_url ? (
                                <img
                                    src={item.image_url}
                                    alt={item.title}
                                    className="w-full h-full object-cover"
                                    crossOrigin="anonymous"
                                />
                            ) : (
                                <div className="text-slate-400 text-xl">No Image Available</div>
                            )}
                        </div>

                        {/* Details */}
                        <div className="text-center space-y-4 mb-8 flex-1">
                            <h2 className="text-5xl font-bold text-slate-900 mb-4" style={{ wordBreak: 'break-word', hyphens: 'auto' }}>{item.title}</h2>

                            {item.reward_amount && showReward && (
                                <div className="inline-block bg-yellow-400 text-black text-3xl font-bold px-6 py-2 rounded-full mb-4 border-2 border-black transform -rotate-2 shadow-lg">
                                    REWARD: {item.currency === 'BDT' ? '৳' : '$'}{item.reward_amount}
                                </div>
                            )}

                            <p className="text-2xl text-slate-600 leading-relaxed max-w-2xl mx-auto whitespace-pre-wrap" style={{ wordBreak: 'normal', wordSpacing: 'normal', overflowWrap: 'break-word', letterSpacing: '0.02em' }}>
                                {description || "Description will appear here..."}
                            </p>

                            <div className="grid grid-cols-2 gap-8 mt-8 text-left max-w-2xl mx-auto bg-slate-50 p-6 rounded-xl border border-slate-200">
                                <div>
                                    <p className="text-sm text-slate-500 uppercase font-bold tracking-wider mb-1">Last Seen Location</p>
                                    <p className="text-xl font-semibold" style={{ wordBreak: 'break-word' }}>{item.location}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-slate-500 uppercase font-bold tracking-wider mb-1">Date</p>
                                    <p className="text-xl font-semibold">{new Date(item.date).toLocaleDateString()}</p>
                                </div>
                            </div>
                        </div>

                        {/* Footer / Contact */}
                        <div className="flex items-center justify-between border-t-4 border-slate-900 pt-8 mt-auto">
                            <div className="text-left">
                                <p className="text-xl font-bold text-slate-500 uppercase tracking-wider mb-2">Scan to Contact Owner</p>
                                <p className="text-sm text-slate-400 max-w-xs">
                                    Scan this QR code to view the full post, see more photos, and contact the owner securely via <span className="font-bold text-slate-600">FindIt</span>.
                                </p>
                            </div>

                            <div className="bg-white p-2 border-2 border-slate-900 rounded-lg">
                                <QRCodeSVG value={itemUrl} size={150} />
                            </div>
                        </div>

                        {/* Branding - Mandatory */}
                        <div className="absolute bottom-2 right-4 text-[10px] text-slate-400 font-mono">
                            Generated by FindIt • findit.com
                        </div>

                        {/* Tear-off tabs (Visual representation) */}
                        <div className="absolute bottom-0 left-0 right-0 flex justify-around border-t border-dashed border-slate-400 pt-4 opacity-50">
                            {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                                <div key={i} className="border-r border-dashed border-slate-400 h-16 w-full text-center text-xs rotate-90 origin-bottom-left translate-x-4">
                                    Scan QR<br />Code
                                </div>
                            ))}
                        </div>

                    </div>
                </div>
            </div>
        </div>
    )
}
